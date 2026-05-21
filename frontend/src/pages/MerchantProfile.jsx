import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign, CreditCard, CheckCircle2, ArrowLeft, Copy, ExternalLink, BadgeCheck, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
  const settledPayments = payments.filter((p) => p.status === 2);
  const totalVolume = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const successRate = totalPayments > 0
    ? ((settledPayments.length / totalPayments) * 100).toFixed(1)
    : '0.0';

  // Chart data — last 30 days
  const chartData = (() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
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
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 shadow-lg">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-slate-50">{payload[0].value} QIE</p>
      </div>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-slate-700 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-700 rounded-xl" />
            ))}
          </div>
          <div className="h-72 bg-slate-700 rounded-xl" />
          <div className="h-64 bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  // Not registered
  if (!registered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-red-500/10 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-50 mb-2">Merchant Not Found</h2>
          <p className="text-slate-400 text-sm font-mono mb-4">{truncateAddr(address)}</p>
          <p className="text-slate-500 mb-6">This address is not registered as a merchant on QIE Pay.</p>
          <Link to="/" className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Filtered payments for the table
  const filteredPayments = payments.filter((p) => {
    const matchSearch = !search.trim() ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      p.id?.toString().includes(search);
    const matchStatus = statusFilter === 'all' || p.status === Number(statusFilter);
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 border border-slate-700 rounded-xl p-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-50">Merchant Profile</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-medium">
                  <BadgeCheck className="w-3 h-3" /> Verified Merchant
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-400 font-mono">{truncateAddr(address)}</span>
                <button
                  onClick={copyAddress}
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`${EXPLORER_URL}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <DollarSign size={18} className="text-emerald-500" />
              </div>
              <span className="text-sm text-slate-400">Total Earnings</span>
            </div>
            <p className="text-2xl font-bold text-slate-50">{parseFloat(earnings).toFixed(2)} QIE</p>
            <p className="text-xs text-slate-500 mt-1">{formatUSD(parseFloat(earnings))}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-sky-500/10 rounded-lg flex items-center justify-center">
                <CreditCard size={18} className="text-sky-500" />
              </div>
              <span className="text-sm text-slate-400">Total Payments</span>
            </div>
            <p className="text-2xl font-bold text-slate-50">{totalPayments}</p>
            <p className="text-xs text-slate-500 mt-1">Volume: {totalVolume.toFixed(2)} QIE</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <span className="text-sm text-slate-400">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-slate-50">{successRate}%</p>
            <p className="text-xs text-slate-500 mt-1">{settledPayments.length} settled</p>
          </motion.div>
        </div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800 border border-slate-700 rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-slate-50 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            Revenue — Last 30 Days
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
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
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-slate-800 border border-slate-700 rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-slate-50 mb-6">Payment History</h2>
          <PaymentTable
            payments={payments}
            showActions={true}
            onSettle={handleSettle}
            onCancel={handleCancel}
          />
        </motion.div>
      </div>
    </div>
  );
}
