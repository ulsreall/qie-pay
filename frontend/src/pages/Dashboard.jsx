import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, CreditCard, Plus, Layers, BarChart3,
  ArrowRight, RefreshCw, PlusCircle, Store, UserCog, Eye, Copy, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';

import StatusBadge from '../components/StatusBadge';
import {
  connectWallet, checkConnection, isMerchant, registerMerchant,
  getMerchantPayments, getMerchantEarnings, settlePayment, getPayment
} from '../utils/contract';
import { mintRewards } from '../utils/defi-contract';
import { formatQIEAmount, formatUSD } from '../utils/currency';
import { useDemo } from '../context/DemoContext';

/* ─── Status Dot ─── */
function StatusDot({ status }) {
  const colors = {
    0: 'bg-sky-400',
    1: 'bg-amber-400',
    2: 'bg-[#34D399]',
    3: 'bg-amber-400',
    4: 'bg-red-400',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || 'bg-[#3F3F46]'}`} />;
}

/* ─── Skeleton ─── */
function SkeletonCard() {
  return (
    <div className="bg-[#111113] border border-[#27272A] rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-md bg-[#18181B]" />
        <div className="h-3 w-20 bg-[#18181B] rounded" />
      </div>
      <div className="h-6 w-28 bg-[#18181B] rounded mb-2" />
      <div className="h-3 w-16 bg-[#18181B] rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 animate-pulse">
      <div className="h-5 w-32 bg-[#18181B] rounded mb-4" />
      <div className="h-[200px] bg-[#18181B] rounded-md" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 animate-pulse">
      <div className="h-5 w-40 bg-[#18181B] rounded mb-4" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2.5 border-b border-[#27272A]/50">
          <div className="h-4 w-8 bg-[#18181B] rounded" />
          <div className="h-4 w-32 bg-[#18181B] rounded flex-1" />
          <div className="h-4 w-20 bg-[#18181B] rounded" />
          <div className="h-4 w-16 bg-[#18181B] rounded" />
        </div>
      ))}
    </div>
  );
}

/* ─── Demo Mode Banner ─── */
function DemoBanner() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <Eye size={14} className="text-amber-400" />
      <span className="text-xs font-medium text-amber-400">Viewing demo data</span>
      <span className="text-[10px] text-amber-400/60 ml-1">Connect a wallet to see your real data</span>
    </div>
  );
}

function CustomTooltipDashboard({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111113] border border-[#27272A] rounded-md px-3 py-2 shadow-lg">
      <p className="text-xs text-[#A1A1AA] mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[#FAFAFA] tabular-nums">{payload[0].value} QIE</p>
      <p className="text-xs text-[#71717A]">{formatUSD(payload[0].value)}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isDemo, demoAddress, demoPayments, demoEarnings, demoChartData } = useDemo();
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

      if (conn.isDemo) {
        // Demo mode — show demo data directly
        setAddress(demoAddress);
        setPayments([...demoPayments].sort((a, b) => b.createdAt - a.createdAt));
        setEarnings(demoEarnings);
        prevPaymentCount.current = demoPayments.length;
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Real wallet connected
      setAddress(conn.address);

      // Check if wallet has balance (new email wallets may have 0 QIE)
      const bal = parseFloat(conn.balance || '0');

      try {
        const registered = await isMerchant(conn.address);
        if (!registered) {
          if (bal < 0.01) {
            // New email wallet — faucet drip pending, show empty dashboard
            setPayments([]);
            setEarnings('0');
            setLoading(false);
            setRefreshing(false);
            return;
          }
          // Auto-register merchant on-chain
          try {
            toast.loading('Registering merchant...', { id: 'register' });
            await registerMerchant();
            toast.success('Merchant registered!', { id: 'register' });
          } catch (regErr) {
            console.warn('Auto-register failed:', regErr.message);
            toast.dismiss('register');
          }
        }
        await fetchPayments(conn.address);
      } catch (err) {
        // Contract call failed — likely new wallet with no balance
        console.warn('Dashboard load warning:', err.message);
        setPayments([]);
        setEarnings('0');
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      if (!silent) toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate, demoAddress, demoPayments, demoEarnings]);

  const fetchPayments = async (addr) => {
    const [pmts, earned] = await Promise.all([
      getMerchantPayments(addr),
      getMerchantEarnings(addr),
    ]);
    if (prevPaymentCount.current > 0 && pmts.length > prevPaymentCount.current) {
      toast.success('New payment received!', { icon: '💰', duration: 5000 });
    }
    prevPaymentCount.current = pmts.length;
    setPayments(pmts.sort((a, b) => b.createdAt - a.createdAt));
    setEarnings(earned);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time polling every 10s (only for real wallets)
  useEffect(() => {
    if (!address || isDemo) return;
    pollRef.current = setInterval(() => {
      fetchPayments(address).catch(console.error);
    }, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [address, isDemo]);

  const handleRefresh = () => loadData();

  const handleSettle = async (id) => {
    if (isDemo) {
      toast('Settle is not available in demo mode', { icon: '🔒' });
      return;
    }
    try {
      toast.loading('Settling payment...', { id: 'settle' });
      await settlePayment(id);
      toast.success('Payment settled!', { id: 'settle' });

      // Mint QIEP rewards to customer
      try {
        const payment = await getPayment(id);
        if (payment.customer && payment.customer !== '0x0000000000000000000000000000000000000000') {
          toast.loading('Minting QIEP rewards...', { id: 'rewards' });
          await mintRewards(payment.customer, id);
          toast.success('QIEP rewards sent! Customer: add QIEP token (0x56A1...Ca4) to wallet to see balance.', { id: 'rewards', duration: 6000 });
        }
      } catch (rewardErr) {
        console.warn('Reward minting failed:', rewardErr);
        toast.error('Reward mint failed — try manually from Rewards page', { id: 'rewards' });
      }

      if (address) await fetchPayments(address);
    } catch (err) {
      toast.error(err?.reason || err?.message || 'Failed to settle', { id: 'settle' });
    }
  };

  /* ─── Compute stats ─── */
  const totalPayments = payments.length;
  const totalVolume = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  /* ─── Chart data (last 7 days) ─── */
  const chartData = useMemo(() => {
    // In demo mode, use pre-computed chart data
    if (isDemo) return demoChartData;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime() / 1000;
      const dayEnd = dayStart + 86400;
      const dayPayments = payments.filter(
        (p) => p.createdAt >= dayStart && p.createdAt < dayEnd && p.status >= 1
      );
      const revenue = dayPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      days.push({
        date: format(new Date(dayStart * 1000), 'MMM d'),
        revenue: parseFloat(revenue.toFixed(2)),
      });
    }
    return days;
  }, [isDemo, demoChartData, payments]);

  const recentPayments = payments.slice(0, 5);

  const relativeTime = (ts) => {
    if (!ts) return '—';
    try {
      return formatDistanceToNow(new Date(ts * 1000), { addSuffix: true });
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="h-6 w-48 bg-[#111113] rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2"><SkeletonCard /></div>
            <SkeletonCard />
          </div>
          <SkeletonChart />
          <SkeletonTable />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen bg-[#09090B] p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Demo Mode Banner */}
        {isDemo && <DemoBanner />}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#FAFAFA] tracking-tight">Dashboard</h1>
            <p className="text-xs text-[#71717A] font-mono mt-0.5">{truncateAddr(address)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/create"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] rounded-md text-xs font-medium text-white transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Payment
            </Link>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#27272A] hover:border-[#3F3F46] rounded-md text-xs text-[#A1A1AA] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Getting Started — show when no payments yet (not in demo mode) */}
        {totalPayments === 0 && !isDemo && (
          <div className="bg-[#111113] border border-[#27272A] rounded-lg p-4">
            <p className="text-sm font-medium text-[#FAFAFA] mb-2">Getting Started</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: 1, label: 'Create your first payment', path: '/create', icon: PlusCircle },
                { step: 2, label: 'Set up your storefront', path: '/store/' + address, icon: Store },
                { step: 3, label: 'Configure your profile', path: '/merchant-settings', icon: UserCog },
              ].map((item) => (
                <Link
                  key={item.step}
                  to={item.path}
                  className="flex items-center gap-3 p-3 rounded-md border border-[#27272A] hover:border-[#3F3F46] hover:bg-[#18181B] transition-all group"
                >
                  <span className="w-6 h-6 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10B981] text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <span className="text-xs text-[#A1A1AA] group-hover:text-[#FAFAFA] transition-colors">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards — asymmetric layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Earnings — wider */}
          <div className="sm:col-span-2 bg-[#111113] border border-[#27272A] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-[#34D399]" />
                </div>
                <span className="text-xs text-[#A1A1AA]">Total Earnings</span>
              </div>
              {/* Sparkline */}
              <div className="w-20 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={1.5} fill="#10B981" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-xl font-semibold text-[#FAFAFA] tabular-nums">{parseFloat(earnings).toFixed(2)} QIE</p>
            <p className="text-xs text-[#71717A] mt-0.5">{formatUSD(earnings)}</p>
          </div>

          {/* Volume */}
          <div className="bg-[#111113] border border-[#27272A] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-md bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#34D399]" />
              </div>
              <span className="text-xs text-[#A1A1AA]">Volume</span>
            </div>
            <p className="text-xl font-semibold text-[#FAFAFA] tabular-nums">{totalVolume.toFixed(2)} QIE</p>
            <p className="text-xs text-[#71717A] mt-0.5">{formatUSD(totalVolume)}</p>
          </div>

          {/* Payments count — below volume on mobile, same row on desktop */}
          <div className="bg-[#111113] border border-[#27272A] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-md bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-[#34D399]" />
              </div>
              <span className="text-xs text-[#A1A1AA]">Payments</span>
            </div>
            <p className="text-xl font-semibold text-[#FAFAFA] tabular-nums">{totalPayments}</p>
            <p className="text-xs text-[#71717A] mt-0.5">total</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[#A1A1AA] mb-4 tracking-tight">Revenue — Last 7 Days</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="emeraldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <Tooltip content={<CustomTooltipDashboard />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#emeraldFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#A1A1AA] tracking-tight">Recent Payments</h2>
            <Link to="/analytics" className="text-xs text-[#10B981] hover:text-[#34D399] transition-colors flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-10">
              <CreditCard className="w-8 h-8 text-[#52525B] mx-auto mb-2" />
              <p className="text-sm text-[#71717A]">No payments yet</p>
              <Link to="/create" className="text-xs text-[#10B981] hover:text-[#34D399] mt-1.5 inline-block">
                Create your first payment →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recentPayments.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`h-10 ${i % 2 === 0 ? '' : 'bg-[#111113]/50'} hover:bg-[#18181B]/30 transition-colors`}
                  >
                    <td className="pl-2 pr-3">
                      <StatusDot status={p.status} />
                    </td>
                    <td className="pr-3">
                      <p className="text-sm text-[#D4D4D8] truncate max-w-[200px]">{p.description || 'No description'}</p>
                    </td>
                    <td className="text-xs text-[#71717A] pr-3 whitespace-nowrap">
                      {relativeTime(p.createdAt)}
                    </td>
                    <td className="text-right pr-2">
                      <span className="text-sm text-[#FAFAFA] font-medium tabular-nums">{formatQIEAmount(p.amount)} QIE</span>
                    </td>
                    <td className="pl-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/pay/${p.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Payment link copied!');
                          }}
                          className="p-1 rounded hover:bg-[#27272A] text-[#71717A] hover:text-[#A1A1AA] transition-colors"
                          title="Copy payment link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/pay/${p.id}`}
                          className="p-1 rounded hover:bg-[#27272A] text-[#71717A] hover:text-[#A1A1AA] transition-colors"
                          title="View payment"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        {p.status === 1 && (
                          <button
                            onClick={() => handleSettle(p.id)}
                            className="px-2 py-0.5 bg-[rgba(16,185,129,0.1)] hover:bg-[rgba(16,185,129,0.2)] text-[#34D399] text-xs rounded transition-colors"
                          >
                            Settle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Inline quick links */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#27272A]/50">
            <Link to="/create" className="text-xs text-[#10B981] hover:text-[#34D399] transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> Create Payment
            </Link>
            <Link to="/batch" className="text-xs text-[#10B981] hover:text-[#34D399] transition-colors flex items-center gap-1">
              <Layers className="w-3 h-3" /> Batch Payments
            </Link>
            <Link to="/analytics" className="text-xs text-[#10B981] hover:text-[#34D399] transition-colors flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Analytics
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
