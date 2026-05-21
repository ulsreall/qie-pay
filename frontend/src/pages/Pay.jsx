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
import { formatQIEAmount, formatUSD } from '../utils/currency';
import { pollPaymentStatus } from '../utils/polling';
import { EXPLORER_URL } from '../utils/constants';

/* ─── Skeleton ─── */
function PaySkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-700 rounded mx-auto mb-6" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-slate-700 rounded" />
              <div className="h-4 w-32 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
        <div className="h-10 w-full bg-slate-700 rounded-md mt-6" />
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

  const statusDot = {
    0: 'bg-sky-400',
    1: 'bg-amber-400',
    2: 'bg-emerald-400',
    3: 'bg-amber-400',
    4: 'bg-red-400',
  };

  const statusLabel = {
    0: 'Awaiting Payment',
    1: 'Paid',
    2: 'Settled',
    3: 'Refunded',
    4: 'Cancelled',
  };

  if (loading) return <PaySkeleton />;
  if (!payment) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-50 mb-1">Payment Not Found</h2>
          <p className="text-slate-400 text-sm mb-4">Payment #{id} does not exist or has been removed.</p>
          <Link to="/" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 relative">
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-lg font-semibold text-slate-50 mb-1 tracking-tight">Payment #{payment.id}</h1>
            <div className="flex items-center justify-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusDot[payment.status] || 'bg-slate-500'}`} />
              <span className="text-xs text-slate-400">{statusLabel[payment.status] || 'Unknown'}</span>
            </div>
            {polling && payment.status === 0 && (
              <p className="text-xs text-sky-400 mt-1.5 flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Waiting for payment...
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-center mb-5">
            <p className="text-3xl font-bold text-emerald-500 tabular-nums">
              {formatQIEAmount(payment.amount)} QIE
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{formatUSD(payment.amount)}</p>
          </div>

          {/* Details */}
          <div className="space-y-0 mb-5">
            {[
              { label: 'Description', value: payment.description || '—' },
              { label: 'Order ID', value: payment.orderId || '—' },
              {
                label: 'Merchant',
                value: <span className="text-sky-400 text-xs font-mono">{truncateAddr(payment.merchant)}</span>,
                isJSX: true,
              },
              { label: 'Date', value: formatDate(payment.createdAt) },
              { label: 'Fee', value: `${formatQIEAmount(payment.fee)} QIE (${formatUSD(payment.fee)})` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-700/40 last:border-0">
                <span className="text-xs text-slate-500">{item.label}</span>
                {item.isJSX ? item.value : (
                  <span className="text-xs text-slate-300">{item.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* Action area based on status */}
          {payment.status === 0 && (
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full h-10 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md text-sm transition-colors disabled:opacity-60"
            >
              {paying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><Wallet className="w-4 h-4" /> Pay {formatQIEAmount(payment.amount)} QIE</>
              )}
            </button>
          )}

          {(payment.status === 1 || payment.status === 2) && (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-50">
                Payment {payment.status === 2 ? 'Settled' : 'Paid'}
              </p>
              <div className="flex gap-2 justify-center">
                <a
                  href={`${EXPLORER_URL}/tx/${payment.customer || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-600 hover:border-slate-500 rounded-md text-xs text-slate-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Explorer
                </a>
                <Link
                  to={`/pay/${payment.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Invoice
                </Link>
              </div>
            </div>
          )}

          {payment.status === 3 && (
            <div className="text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-50">Payment Refunded</p>
              <p className="text-xs text-slate-400">The amount has been refunded to the customer.</p>
            </div>
          )}

          {payment.status === 4 && (
            <div className="text-center space-y-2">
              <XCircle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-50">Payment Cancelled</p>
              <p className="text-xs text-slate-400">This payment has been cancelled by the merchant.</p>
            </div>
          )}

          {/* QR Code (only for Created) */}
          {payment.status === 0 && (
            <div className="mt-5 pt-4 border-t border-slate-700 flex justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white p-3 rounded-lg">
                  <QRCodeSVG
                    value={`${window.location.origin}/pay/${payment.id}`}
                    size={120}
                    bgColor="#ffffff"
                    fgColor="#10B981"
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-xs text-slate-500">Scan to Pay</p>
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Back to QIE Pay
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
