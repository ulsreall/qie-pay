import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, DollarSign, CreditCard,
  Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  connectWallet, getMerchantPayments, getMerchantEarnings, checkConnection,
} from '../utils/contract';
import { formatQIEAmount, formatUSD } from '../utils/currency';

export default function Analytics() {
  const [wallet, setWallet] = useState(null);
  const [payments, setPayments] = useState([]);
  const [earnings, setEarnings] = useState('0');
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      const connected = await checkConnection();
      if (!connected) { setLoading(false); return; }
      setWallet(connected);
      const [earningsData, paymentsData] = await Promise.all([
        getMerchantEarnings(connected.address),
        getMerchantPayments(connected.address),
      ]);
      setEarnings(earningsData);
      setPayments(paymentsData.reverse());
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  // Filter by period
  const filteredPayments = (() => {
    if (period === 'all') return payments;
    const now = Date.now() / 1000;
    const ranges = { day: 86400, week: 604800, month: 2592000 };
    const cutoff = now - (ranges[period] || 0);
    return payments.filter((p) => p.createdAt >= cutoff);
  })();

  // Revenue over time
  const revenueByDate = {};
  filteredPayments.filter((p) => p.status >= 1).forEach((p) => {
    const date = p.createdAt ? new Date(p.createdAt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
    revenueByDate[date] = (revenueByDate[date] || 0) + parseFloat(p.amount);
  });
  const revenueData = Object.entries(revenueByDate).map(([name, amount]) => ({ name, amount: parseFloat(amount.toFixed(4)) }));

  // Stats
  const paidPayments = filteredPayments.filter((p) => p.status >= 1);
  const totalVolume = paidPayments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const avgSize = paidPayments.length > 0 ? totalVolume / paidPayments.length : 0;
  const createdCount = filteredPayments.length;
  const paidCount = paidPayments.length;

  if (!wallet && !loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto py-20 text-center">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <BarChart3 size={36} className="text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-50 mb-2">Analytics</h2>
          <p className="text-slate-400 text-sm mb-4">Connect your wallet to view analytics</p>
          <button
            onClick={() => connectWallet().then(init).catch((e) => toast.error(e.message))}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md text-sm transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-50 tracking-tight">Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Revenue insights and payment metrics</p>
        </div>
        <div className="flex items-center gap-3">
          {['all', 'day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs font-medium transition-colors ${
                period === p ? 'text-emerald-400 border-b border-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {p === 'all' ? 'All Time' : p === 'day' ? '24h' : p === 'week' ? '7d' : '30d'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats — 3 cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Total Revenue</span>
          </div>
          <p className="text-lg font-semibold text-slate-50 tabular-nums">{formatQIEAmount(totalVolume.toString())} QIE</p>
          <p className="text-xs text-slate-500 mt-0.5">{formatUSD(totalVolume.toString())}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Avg Payment</span>
          </div>
          <p className="text-lg font-semibold text-slate-50 tabular-nums">{avgSize.toFixed(4)} QIE</p>
          <p className="text-xs text-slate-500 mt-0.5">{formatUSD(avgSize.toString())}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={14} className="text-emerald-400" />
            <span className="text-xs text-slate-400">Payments</span>
          </div>
          <p className="text-lg font-semibold text-slate-50 tabular-nums">{paidCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">of {createdCount} created</p>
        </div>
      </div>

      {/* Revenue Chart (same style as Dashboard) */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 tracking-tight">Revenue Over Time</h3>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="emeraldRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <Tooltip
                contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 6, color: '#F8FAFC', fontSize: 12 }}
                labelStyle={{ color: '#94A3B8' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#10B981" fillOpacity={1} fill="url(#emeraldRevenue)" strokeWidth={2} name="QIE" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-500 text-xs">No revenue data</div>
        )}
      </div>

      {/* Top Payments */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 tracking-tight">Top Payments by Amount</h3>
        {(() => {
          const topPayments = [...filteredPayments].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount)).slice(0, 5);
          return topPayments.length > 0 ? (
            <table className="w-full text-sm">
              <tbody>
                {topPayments.map((p, i) => (
                  <tr key={p.id} className={`h-10 ${i % 2 === 0 ? '' : 'bg-slate-800/50'}`}>
                    <td className="text-xs text-slate-500 w-6 pl-1">#{i + 1}</td>
                    <td>
                      <p className="text-sm text-slate-200 truncate max-w-[200px]">{p.description || 'Untitled'}</p>
                      <p className="text-xs text-slate-500">ID: {p.id}</p>
                    </td>
                    <td className="text-right pr-1">
                      <p className="text-sm font-medium text-slate-50 tabular-nums">{formatQIEAmount(p.amount)} QIE</p>
                      <p className="text-xs text-slate-500">{formatUSD(p.amount)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-slate-500 text-xs py-6">No payments yet</p>
          );
        })()}
      </div>
    </motion.div>
  );
}
