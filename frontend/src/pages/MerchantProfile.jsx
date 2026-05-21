import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign, CreditCard, CheckCircle2, ArrowLeft, Copy, ExternalLink, BadgeCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

import StatsCard from '../components/StatsCard';
import PaymentTable from '../components/PaymentTable';
import {
  getMerchantPayments, getMerchantEarnings, isMerchant, settlePayment, cancelPayment
} from '../utils/contract';
import { BLOCK_EXPLORER } from '../utils/constants';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

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
  const settledPayments = payments.filter((p) => p.status === 2);
  const totalVolume = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const successRate = totalPayments > 0
    ? ((settledPayments.length / totalPayments) * 100).toFixed(1)
    : '0.0';

  // Chart data
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
      <div className="backdrop-blur-xl bg-gray-900/90 border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-white">{payload[0].value} QIE</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-white/5 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl" />
            ))}
          </div>
          <div className="h-72 bg-white/5 rounded-2xl" />
          <div className="h-64 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!registered) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Merchant Not Found</h2>
          <p className="text-gray-400 text-sm font-mono mb-4">{truncateAddr(address)}</p>
          <p className="text-gray-500 mb-6">This address is not registered as a merchant on QIE Pay.</p>
          <Link to="/" className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">Merchant Profile</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-mono">{truncateAddr(address)}</span>
                <button onClick={copyAddress} className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`${BLOCK_EXPLORER}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <motion.div variants={fadeUp}>
            <StatsCard icon={DollarSign} label="Total Earnings" value={parseFloat(earnings).toFixed(2)} color="purple" />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatsCard icon={CreditCard} label="Total Payments" value={totalPayments} color="cyan" />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatsCard icon={CheckCircle2} label="Success Rate" value={`${successRate}%`} color="green" />
          </motion.div>
        </motion.div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-6">Revenue — Last 30 Days</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="merchantGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fill="url(#merchantGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-6">Payment History</h2>
          <PaymentTable payments={payments} showActions={true} onSettle={handleSettle} onCancel={handleCancel} />
        </motion.div>
      </div>
    </div>
  );
}
