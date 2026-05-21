import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, Wallet, CheckCircle2, XCircle, Clock, ExternalLink, FileText,
  ArrowLeft, AlertTriangle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import StatusBadge from '../components/StatusBadge';
import { getPayment, payForPayment, connectWallet, checkConnection } from '../utils/contract';
import { formatQIEAmount, formatUSD, getQIEPrice } from '../utils/currency';
import { pollPaymentStatus } from '../utils/polling';
import { EXPLORER_URL } from '../utils/constants';

/* ─── Skeleton ─── */
function PaySkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-xl p-8 animate-pulse">
        <div className="h-6 w-48 bg-slate-700 rounded mx-auto mb-8" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-slate-700 rounded" />
              <div className="h-4 w-32 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
        <div className="h-12 w-full bg-slate-700 rounded-lg mt-8" />
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-50 mb-2">Payment Not Found</h2>
          <p className="text-slate-400 mb-6">Payment #{id} does not exist or has been removed.</p>
          <Link to="/" className="text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1 justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const statusIcon = {
    0: <Clock className="w-8 h-8 text-sky-400" />,
    1: <CheckCircle2 className="w-8 h-8 text-amber-400" />,
    2: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
    3: <RefreshCw className="w-8 h-8 text-amber-400" />,
    4: <XCircle className="w-8 h-8 text-red-400" />,
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg"
      >
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700 flex items-center justify-center">
              {statusIcon[payment.status]}
            </div>
            <h1 className="text-2xl font-bold text-slate-50 mb-2">Payment #{payment.id}</h1>
            <StatusBadge status={payment.status} />
            {polling && payment.status === 0 && (
              <p className="text-xs text-sky-400 mt-2 flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Waiting for payment...
              </p>
            )}
          </div>

          {/* Amount highlight */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-center mb-6">
            <p className="text-3xl font-bold text-emerald-500 mb-1">
              {formatQIEAmount(payment.amount)} QIE
            </p>
            <p className="text-sm text-slate-400">{formatUSD(payment.amount)}</p>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-8">
            {[
              { label: 'Description', value: payment.description || '—' },
              { label: 'Order ID', value: payment.orderId || '—' },
              {
                label: 'Merchant',
                value: (
                  <span className="text-sky-400 text-sm font-mono">
                    {truncateAddr(payment.merchant)}
                  </span>
                ),
                isJSX: true,
              },
              { label: 'Date', value: formatDate(payment.createdAt) },
              { label: 'Platform Fee', value: `${formatQIEAmount(payment.fee)} QIE (${formatUSD(payment.fee)})` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                <span className="text-sm text-slate-400">{item.label}</span>
                {item.isJSX ? item.value : (
                  <span className="text-sm text-slate-200">{item.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* Action area based on status */}
          {payment.status === 0 && (
            <div className="space-y-4">
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg text-lg transition-colors disabled:opacity-60"
              >
                {paying ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...</>
                ) : (
                  <><Wallet className="w-5 h-5" /> Pay {formatQIEAmount(payment.amount)} QIE</>
                )}
              </button>
            </div>
          )}

          {(payment.status === 1 || payment.status === 2) && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center ring-2 ring-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <p className="text-lg font-semibold text-slate-50">
                Payment {payment.status === 2 ? 'Settled' : 'Paid'}!
              </p>
              <div className="flex gap-3 justify-center">
                <a
                  href={`${EXPLORER_URL}/tx/${payment.customer || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-600 hover:border-slate-500 rounded-lg text-sm text-slate-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Explorer
                </a>
                <Link
                  to={`/pay/${payment.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <FileText className="w-4 h-4" /> Invoice
                </Link>
              </div>
            </div>
          )}

          {payment.status === 3 && (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-lg font-semibold text-slate-50">Payment Refunded</p>
              <p className="text-sm text-slate-400">The payment amount has been refunded to the customer.</p>
            </div>
          )}

          {payment.status === 4 && (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-lg font-semibold text-slate-50">Payment Cancelled</p>
              <p className="text-sm text-slate-400">This payment has been cancelled by the merchant.</p>
            </div>
          )}

          {/* QR Code (only for Created) */}
          {payment.status === 0 && (
            <div className="mt-8 pt-6 border-t border-slate-700 flex justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG
                    value={`${window.location.origin}/pay/${payment.id}`}
                    size={150}
                    bgColor="#ffffff"
                    fgColor="#10B981"
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-sm text-slate-400 font-medium">Scan to Pay</p>
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 justify-center">
              <ArrowLeft className="w-3 h-3" /> Back to QIE Pay
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
