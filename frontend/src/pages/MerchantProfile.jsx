import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign, CreditCard, CheckCircle2, ArrowLeft, Copy, ExternalLink, BadgeCheck, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

import PaymentTable from '../components/PaymentTable';
import {
  getMerchantPayments, getMerchantEarnings, isMerchant, settlePayment, cancelPayment
} from '../utils/contract';
import { EXPLORER_URL } from '../utils/constants';
import { formatQIEAmount, formatUSD } from '../utils/currency';

export default function MerchantProfile() {
  const { address } = useParams();
  const [payments, setPayments] = useState([]);
  const [earnings, setEarnings] = useState('0');
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  const truncateAddr = (addr) => addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : '';

  useEffect(() => {
    (async () => {
      try {
        const [isMerch, pmts, earned] = await Promise.all([
          isMerchant(address),
          getMerchantPayments(address),
          getMerchantEarnings(address),
        ]);
        setRegistered(isMerch);
        setPayments(pmts.sort((a, b) => b.createdAt - a.createdAt));
        setEarnings(earned);
      } catch (err) {
        console.error('Merchant profile error:', err);
        toast.error('Failed to load merchant profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [address]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied!');
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleSettle = async (id) => {
    try {
      toast.loading('Settling...', { id: 'settle' });
      await settlePayment(id);
      toast.success('Settled!', { id: 'settle' });
      const [pmts, earned] = await Promise.all([
        getMerchantPayments(address),
        getMerchantEarnings(address),
      ]);
      setPayments(pmts.sort((a, b) => b.createdAt - a.createdAt));
      setEarnings(earned);
    } catch (err) {
      toast.error(err?.reason || 'Settle failed', { id: 'settle' });
    }
  };

  const handleCancel = async (id) => {
    try {
      toast.loading('Cancelling...', { id: 'cancel' });
      await cancelPayment(id);
      toast.success('Cancelled!', { id: 'cancel' });
      const [pmts, earned] = await Promise.all([
        getMerchantPayments(address),
        getMerchantEarnings(address),
      ]);
      setPayments(pmts.sort((a, b) => b.createdAt - a.createdAt));
      setEarnings(earned);
    } catch (err) {
      toast.error(err?.reason || 'Cancel failed', { id: 'cancel' });
    }
  };

  // Stats
  const totalPayments = payments.length;
  const totalVolume = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  // Chart data — last 7 days
  const chartData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime() / 1000;
      const dayEnd = dayStart + 86400;
      const dayPayments = payments.filter(
        (p) => p.createdAt >= dayStart && p.createdAt < dayEnd && (p.status === 1 || p.status === 2)
      );
      const revenue = dayPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      days.push({
        date: format(new Date(dayStart * 1000), 'MMM d'),
        revenue: parseFloat(revenue.toFixed(2)),
      });
    }
    return days;
  })();

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 shadow-lg">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-50 tabular-nums">{payload[0].value} QIE</p>
      </div>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-4 animate-pulse">
          <div className="h-16 bg-slate-700 rounded-lg" />
          <div className="h-12 bg-slate-700 rounded-lg" />
          <div className="h-[200px] bg-slate-700 rounded-lg" />
          <div className="h-48 bg-slate-700 rounded-lg" />
        </div>
      </div>
    );
  }

  // Not registered
  if (!registered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <CreditCard className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-50 mb-1">Merchant Not Found</h2>
          <p className="text-slate-400 text-xs font-mono mb-3">{truncateAddr(address)}</p>
          <p className="text-slate-500 text-sm mb-4">This address is not registered as a merchant on QIE Pay.</p>
          <Link to="/" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Hero — minimal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800 border border-slate-700 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-slate-50 tracking-tight">{truncateAddr(address)}</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              </div>
              <button onClick={copyAddress} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-all">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a href={`${EXPLORER_URL}/address/${address}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-all">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <Link to="/" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back
            </Link>
          </div>
        </motion.div>

        {/* Stats — 3 inline */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <DollarSign size={14} className="text-emerald-400" />
              <span className="text-xs text-slate-400">Earnings</span>
            </div>
            <p className="text-lg font-semibold text-slate-50 tabular-nums">{parseFloat(earnings).toFixed(2)} QIE</p>
            <p className="text-xs text-slate-500">{formatUSD(parseFloat(earnings))}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <CreditCard size={14} className="text-emerald-400" />
              <span className="text-xs text-slate-400">Payments</span>
            </div>
            <p className="text-lg font-semibold text-slate-50 tabular-nums">{totalPayments}</p>
            <p className="text-xs text-slate-500">{totalVolume.toFixed(2)} QIE volume</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-xs text-slate-400">Volume</span>
            </div>
            <p className="text-lg font-semibold text-slate-50 tabular-nums">{totalVolume.toFixed(2)} QIE</p>
            <p className="text-xs text-slate-500">{formatUSD(totalVolume)}</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 tracking-tight">Revenue — Last 7 Days</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 tracking-tight">Payment History</h2>
          <PaymentTable
            payments={payments}
            showActions={true}
            onSettle={handleSettle}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
