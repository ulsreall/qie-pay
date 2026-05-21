import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, DollarSign, CreditCard, Percent, Crown,
  Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  connectWallet, getMerchantPayments, getMerchantEarnings, checkConnection,
} from '../utils/contract';
import StatsCard from '../components/StatsCard';
import { formatQIEAmount, formatUSD } from '../utils/currency';
import { STATUS_MAP } from '../utils/constants';

const PIE_COLORS = ['#F59E0B', '#10B981', '#06B6D4', '#F97316', '#EF4444'];

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

  // Status distribution
  const statusCounts = {};
  filteredPayments.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });
  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_MAP[parseInt(status)] || 'Unknown',
    value: count,
  }));

  // Top payments
  const topPayments = [...filteredPayments].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount)).slice(0, 5);

  // Stats
  const paidPayments = filteredPayments.filter((p) => p.status >= 1);
  const totalVolume = paidPayments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const avgSize = paidPayments.length > 0 ? totalVolume / paidPayments.length : 0;
  const createdCount = filteredPayments.length;
  const paidCount = paidPayments.length;
  const conversionRate = createdCount > 0 ? Math.round((paidCount / createdCount) * 100) : 0;
  const largestPayment = paidPayments.length > 0
    ? Math.max(...paidPayments.map((p) => parseFloat(p.amount)))
    : 0;

  if (!wallet && !loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto py-20 text-center">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-10">
          <BarChart3 size={48} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-50 mb-3">Analytics</h2>
          <p className="text-slate-400 mb-6">Connect your wallet to view analytics</p>
          <button
            onClick={() => connectWallet().then(init).catch((e) => toast.error(e.message))}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
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
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Revenue insights and payment metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
          {['all', 'day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === 'all' ? 'All Time' : p === 'day' ? '24h' : p === 'week' ? '7d' : '30d'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={DollarSign} label="Total Revenue" value={`${formatQIEAmount(totalVolume.toString())} QIE`} subValue={formatUSD(totalVolume.toString())} color="emerald" />
        <StatsCard icon={TrendingUp} label="Average Payment" value={`${avgSize.toFixed(4)} QIE`} subValue={formatUSD(avgSize.toString())} color="emerald" />
        <StatsCard icon={Percent} label="Success Rate" value={`${conversionRate}%`} subValue={`${createdCount} total → ${paidCount} paid`} color="amber" />
        <StatsCard icon={Crown} label="Largest Payment" value={`${formatQIEAmount(largestPayment.toString())} QIE`} subValue={formatUSD(largestPayment.toString())} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Revenue Over Time</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="emeraldRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, color: '#F8FAFC', fontSize: 13 }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10B981" fillOpacity={1} fill="url(#emeraldRevenue)" strokeWidth={2} name="QIE" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm">No revenue data</div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Status Distribution</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, color: '#F8FAFC', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-400">{entry.name}</span>
                    </div>
                    <span className="text-slate-50 font-medium">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Top Payments */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 mb-4">Top Payments by Amount</h3>
        {topPayments.length > 0 ? (
          <div className="space-y-3">
            {topPayments.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-500 w-6">#{i + 1}</span>
                  <div>
                    <p className="text-sm text-slate-50">{p.description || 'Untitled'}</p>
                    <p className="text-xs text-slate-500">ID: {p.id} · {p.orderId || '-'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-50">{formatQIEAmount(p.amount)} QIE</p>
                  <p className="text-xs text-slate-500">{formatUSD(p.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">No payments yet</p>
        )}
      </div>
    </motion.div>
  );
}
