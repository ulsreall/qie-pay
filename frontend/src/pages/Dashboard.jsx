import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, CreditCard, CheckCircle2, Plus, Layers, BarChart3,
  ArrowRight, RefreshCw, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import {
  connectWallet, checkConnection, isMerchant, registerMerchant,
  getMerchantPayments, getMerchantEarnings, settlePayment
} from '../utils/contract';
import { formatQIEAmount, formatUSD, qieToUSD } from '../utils/currency';
import { BLOCK_EXPLORER } from '../utils/constants';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* ─── Skeleton ─── */
function SkeletonCard() {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/10" />
        <div className="h-3 w-20 bg-white/10 rounded" />
      </div>
      <div className="h-7 w-28 bg-white/10 rounded mb-2" />
      <div className="h-3 w-16 bg-white/10 rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
      <div className="h-5 w-32 bg-white/10 rounded mb-6" />
      <div className="h-64 bg-white/5 rounded-xl" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
      <div className="h-5 w-40 bg-white/10 rounded mb-6" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-white/5">
          <div className="h-4 w-8 bg-white/10 rounded" />
          <div className="h-4 w-32 bg-white/10 rounded flex-1" />
          <div className="h-4 w-20 bg-white/10 rounded" />
          <div className="h-4 w-16 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [address, setAddress] = useState(null);
  const [payments, setPayments] = useState([]);
  const [earnings, setEarnings] = useState('0');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const prevPaymentCount = useRef(0);
  const pollRef = useRef(null);

  const truncateAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  /* ─── Load data ─── */
  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const conn = await checkConnection();
      if (!conn) {
        // Try connecting
        try {
          const wallet = await connectWallet();
          setAddress(wallet.address);
          // Ensure merchant
          const registered = await isMerchant(wallet.address);
          if (!registered) {
            await registerMerchant();
            toast.success('Merchant registered!');
          }
          await fetchPayments(wallet.address);
        } catch {
          navigate('/create');
          return;
        }
      } else {
        setAddress(conn.address);
        const registered = await isMerchant(conn.address);
        if (!registered) {
          navigate('/create');
          return;
        }
        await fetchPayments(conn.address);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      if (!silent) toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  const fetchPayments = async (addr) => {
    const [pmts, earned] = await Promise.all([
      getMerchantPayments(addr),
      getMerchantEarnings(addr),
    ]);
    // Check for new payments
    if (prevPaymentCount.current > 0 && pmts.length > prevPaymentCount.current) {
      toast.success('New payment received! 🎉', { icon: '💰', duration: 5000 });
    }
    prevPaymentCount.current = pmts.length;
    setPayments(pmts.sort((a, b) => b.createdAt - a.createdAt));
    setEarnings(earned);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time polling every 10s
  useEffect(() => {
    if (!address) return;
    pollRef.current = setInterval(() => {
      fetchPayments(address).catch(console.error);
    }, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [address]);

  const handleRefresh = () => loadData();

  const handleSettle = async (id) => {
    try {
      toast.loading('Settling payment...', { id: 'settle' });
      await settlePayment(id);
      toast.success('Payment settled!', { id: 'settle' });
      if (address) await fetchPayments(address);
    } catch (err) {
      toast.error(err?.reason || err?.message || 'Failed to settle', { id: 'settle' });
    }
  };

  /* ─── Compute stats ─── */
  const totalPayments = payments.length;
  const settledPayments = payments.filter((p) => p.status === 2);
  const totalVolume = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const successRate = totalPayments > 0
    ? ((settledPayments.length / totalPayments) * 100).toFixed(1)
    : '0.0';

  /* ─── Chart data (last 7 days) ─── */
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
        count: dayPayments.length,
      });
    }
    return days;
  })();

  const recentPayments = payments.slice(0, 5);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="backdrop-blur-xl bg-gray-900/90 border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-white">{payload[0].value} QIE</p>
        <p className="text-xs text-gray-500">{formatUSD(payload[0].value)}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonChart />
          <SkeletonTable />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1 font-mono">{truncateAddr(address)}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <motion.div variants={fadeUp}>
            <StatsCard
              icon={DollarSign}
              label="Total Earnings"
              value={parseFloat(earnings).toFixed(2)}
              subValue={formatUSD(earnings)}
              color="purple"
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatsCard
              icon={TrendingUp}
              label="Total Volume"
              value={totalVolume.toFixed(2)}
              subValue={formatUSD(totalVolume)}
              color="cyan"
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatsCard
              icon={CreditCard}
              label="Total Payments"
              value={totalPayments}
              color="blue"
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatsCard
              icon={CheckCircle2}
              label="Success Rate"
              value={`${successRate}%`}
              color="green"
            />
          </motion.div>
        </motion.div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-6">Revenue — Last 7 Days</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#purpleGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Payments + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Payments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Recent Payments</h2>
              <Link to="/dashboard" className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recentPayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No payments yet</p>
                <Link to="/create" className="text-sm text-purple-400 hover:text-purple-300 mt-2 inline-block">
                  Create your first payment →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-purple-400">#{p.id}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{p.description || 'No description'}</p>
                        <p className="text-xs text-gray-500">
                          {p.createdAt ? format(new Date(p.createdAt * 1000), 'MMM d, HH:mm') : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{formatQIEAmount(p.amount)} QIE</p>
                        <p className="text-xs text-gray-500">{formatUSD(p.amount)}</p>
                      </div>
                      <StatusBadge status={p.status} />
                      {p.status === 1 && (
                        <button
                          onClick={() => handleSettle(p.id)}
                          className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs rounded-lg transition-all"
                        >
                          Settle
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-5">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { icon: Plus, label: 'Create Payment', to: '/create', color: 'purple' },
                { icon: Layers, label: 'Batch Payments', to: '/create', color: 'cyan' },
                { icon: BarChart3, label: 'View Analytics', to: '/dashboard', color: 'green' },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    action.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                    action.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1">{action.label}</span>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
