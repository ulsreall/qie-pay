import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Wallet, CheckCircle2, XCircle, Clock, ExternalLink, FileText,
  ArrowLeft, AlertTriangle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import StatusBadge from '../components/StatusBadge';
import PaymentQRCode from '../components/QRCode';
import { getPayment, payForPayment, connectWallet, checkConnection } from '../utils/contract';
import { formatQIEAmount, formatUSD, getQIEPrice } from '../utils/currency';
import { pollPaymentStatus } from '../utils/polling';
import { BLOCK_EXPLORER } from '../utils/constants';

/* ─── Skeleton ─── */
function PaySkeleton() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 animate-pulse">
        <div className="h-6 w-48 bg-white/10 rounded mx-auto mb-8" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-white/10 rounded" />
              <div className="h-4 w-32 bg-white/10 rounded" />
            </div>
          ))}
        </div>
        <div className="h-12 w-full bg-white/10 rounded-xl mt-8" />
      </div>
    </div>
  );
}

export default function Pay() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [polling, setPolling] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const pollCleanup = useRef(null);

  /* ─── Load payment ─── */
  const loadPayment = async () => {
    try {
      const p = await getPayment(id);
      setPayment(p);
    } catch (err) {
      toast.error('Payment not found');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
    // Check wallet
    checkConnection().then((conn) => {
      if (conn) setWalletAddress(conn.address);
    }).catch(() => {});
    return () => { if (pollCleanup.current) pollCleanup.current(); };
  }, [id]);

  /* ─── Auto-poll if payment is Created ─── */
  useEffect(() => {
    if (!payment || payment.status !== 0) return;
    setPolling(true);
    pollCleanup.current = pollPaymentStatus(id, (updated, changed) => {
      if (changed) {
        setPayment(updated);
        setPolling(false);
        toast.success(`Payment ${updated.status === 1 ? 'paid' : 'updated'}!`);
      }
    }, 5000);
    return () => { if (pollCleanup.current) pollCleanup.current(); };
  }, [payment?.status, id]);

  /* ─── Pay ─── */
  const handlePay = async () => {
    setPaying(true);
    try {
      if (!walletAddress) {
        const wallet = await connectWallet();
        setWalletAddress(wallet.address);
      }
      await payForPayment(payment.id, payment.amount);
      toast.success('Payment sent!');
      // Reload payment
      const updated = await getPayment(id);
      setPayment(updated);
    } catch (err) {
      toast.error(err?.reason || err?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    try { return format(new Date(ts * 1000), 'MMM d, yyyy HH:mm'); } catch { return '—'; }
  };

  const truncateAddr = (addr) => addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : '—';

  if (loading) return <PaySkeleton />;
  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Payment Not Found</h2>
          <p className="text-gray-400 mb-6">Payment #{id} does not exist or has been removed.</p>
          <Link to="/" className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const statusIcon = {
    0: <Clock className="w-8 h-8 text-blue-400" />,
    1: <CheckCircle2 className="w-8 h-8 text-yellow-400" />,
    2: <CheckCircle2 className="w-8 h-8 text-green-400" />,
    3: <RefreshCw className="w-8 h-8 text-orange-400" />,
    4: <XCircle className="w-8 h-8 text-red-400" />,
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
          {/* Glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                {statusIcon[payment.status]}
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Payment #{payment.id}</h1>
              <StatusBadge status={payment.status} />
              {polling && payment.status === 0 && (
                <p className="text-xs text-blue-400 mt-2 flex items-center justify-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Waiting for payment...
                </p>
              )}
            </div>

            {/* Details */}
            <div className="space-y-3 mb-8">
              {[
                { label: 'Description', value: payment.description || '—' },
                { label: 'Order ID', value: payment.orderId || '—' },
                {
                  label: 'Merchant',
                  value: (
                    <Link to={`/merchant/${payment.merchant}`} className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-mono">
                      {truncateAddr(payment.merchant)}
                    </Link>
                  ),
                  isJSX: true,
                },
                { label: 'Date', value: formatDate(payment.createdAt) },
                {
                  label: 'Amount',
                  value: `${formatQIEAmount(payment.amount)} QIE (${formatUSD(payment.amount)})`,
                  highlight: true,
                },
                { label: 'Platform Fee', value: `${formatQIEAmount(payment.fee)} QIE (${formatUSD(payment.fee)})` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  {item.isJSX ? item.value : (
                    <span className={`text-sm ${item.highlight ? 'text-white font-semibold' : 'text-gray-300'}`}>
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Action area based on status */}
            <AnimatePresence mode="wait">
              {payment.status === 0 && (
                <motion.div
                  key="pay"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-400">
                      Amount to pay: <span className="font-bold">{formatQIEAmount(payment.amount)} QIE</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatUSD(payment.amount)}</p>
                  </div>
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all disabled:opacity-60"
                  >
                    {paying ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...</>
                    ) : (
                      <><Wallet className="w-5 h-5" /> Pay {formatQIEAmount(payment.amount)} QIE</>
                    )}
                  </button>
                </motion.div>
              )}

              {(payment.status === 1 || payment.status === 2) && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center ring-2 ring-green-500/20"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <p className="text-lg font-semibold text-white">
                    Payment {payment.status === 2 ? 'Settled' : 'Paid'}!
                  </p>
                  <div className="flex gap-3 justify-center">
                    <a
                      href={`${BLOCK_EXPLORER}/tx/${payment.customer || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" /> Explorer
                    </a>
                    <Link
                      to={`/pay/${payment.id}`}
                      className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm text-purple-400 hover:bg-purple-500/20 transition-all"
                    >
                      <FileText className="w-4 h-4" /> Invoice
                    </Link>
                  </div>
                </motion.div>
              )}

              {payment.status === 3 && (
                <motion.div
                  key="refunded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-3"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-orange-400" />
                  </div>
                  <p className="text-lg font-semibold text-white">Payment Refunded</p>
                  <p className="text-sm text-gray-400">The payment amount has been refunded to the customer.</p>
                </motion.div>
              )}

              {payment.status === 4 && (
                <motion.div
                  key="cancelled"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-3"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-lg font-semibold text-white">Payment Cancelled</p>
                  <p className="text-sm text-gray-400">This payment has been cancelled by the merchant.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* QR Code (only for Created) */}
            {payment.status === 0 && (
              <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                <PaymentQRCode value={`${window.location.origin}/pay/${payment.id}`} size={150} />
              </div>
            )}

            {/* Back link */}
            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1 justify-center">
                <ArrowLeft className="w-3 h-3" /> Back to QIE Pay
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
