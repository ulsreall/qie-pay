import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, Wallet, CheckCircle2, XCircle, Clock, ExternalLink, FileText,
  ArrowLeft, AlertTriangle, RefreshCw, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import StatusBadge from '../components/StatusBadge';
import { getPayment, payForPayment, connectWallet, checkConnection, getBalance } from '../utils/contract';
import { formatQIEAmount, formatUSD } from '../utils/currency';
import { pollPaymentStatus } from '../utils/polling';
import { EXPLORER_URL } from '../utils/constants';
import { useDemo } from '../context/DemoContext';
import { DEMO_PAYMENTS, DEMO_ADDRESS } from '../utils/demoData';

/* ─── Error parser ─── */
function parsePaymentError(err) {
  const msg = err?.reason || err?.message || String(err);
  if (msg.includes('merchant cannot pay own invoice') || msg.includes('msg.sender != payment.merchant')) {
    return "You can't pay your own invoice. Switch to a different wallet.";
  }
  if (msg.includes('insufficient') || msg.includes('not enough')) {
    return 'Insufficient QIE balance to complete this payment.';
  }
  if (msg.includes('not available') || msg.includes('not Created')) {
    return 'This payment is no longer available (already paid or cancelled).';
  }
  if (msg.includes('zero amount')) {
    return 'Payment amount is zero.';
  }
  if (msg.includes('user rejected') || msg.includes('User denied')) {
    return 'Transaction was rejected by user.';
  }
  if (msg.includes('CALL_EXCEPTION')) {
    return 'Transaction failed — check your balance and make sure you are on QIE Testnet.';
  }
  return msg || 'Payment failed. Please try again.';
}

/* ─── Skeleton ─── */
function PaySkeleton() {
  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111113] border border-[#27272A] rounded-lg p-6 animate-pulse">
        <div className="h-5 w-40 bg-[#18181B] rounded mx-auto mb-6" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-[#18181B] rounded" />
              <div className="h-4 w-32 bg-[#18181B] rounded" />
            </div>
          ))}
        </div>
        <div className="h-10 w-full bg-[#18181B] rounded-md mt-6" />
      </div>
    </div>
  );
}

export default function Pay() {
  const { id } = useParams();
  const { isDemo, demoPayments } = useDemo();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [polling, setPolling] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const pollCleanup = useRef(null);

  /* ─── Load payment ─── */
  const loadPayment = async () => {
    try {
      // First check demo payments
      const demoPayment = demoPayments.find(
        (p) => p.id === id || p.id === String(id)
      );

      if (demoPayment) {
        setPayment({ ...demoPayment });
        setLoading(false);
        return;
      }

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
    checkConnection().then(async (conn) => {
      if (conn && !conn.isDemo) {
        setWalletAddress(conn.address);
        // Fetch native balance on QIE Testnet
        setBalanceLoading(true);
        try {
          const balResult = await getBalance(conn.address);
          setWalletBalance(balResult.balance);
        } catch { setWalletBalance('0'); }
        setBalanceLoading(false);
      }
    }).catch(() => {});
    return () => { if (pollCleanup.current) pollCleanup.current(); };
  }, [id]);

  /* ─── Auto-poll if payment is Created (real wallets only) ─── */
  useEffect(() => {
    if (!payment || payment.status !== 0 || isDemo) return;
    setPolling(true);
    pollCleanup.current = pollPaymentStatus(id, (updated, changed) => {
      if (changed) {
        setPayment(updated);
        setPolling(false);
        toast.success(`Payment ${updated.status === 1 ? 'paid' : 'updated'}!`);
      }
    }, 5000);
    return () => { if (pollCleanup.current) pollCleanup.current(); };
  }, [payment?.status, id, isDemo]);

  /* ─── Pay ─── */
  const handlePay = async () => {
    // In demo mode, prompt wallet connection first
    if (isDemo) {
      try {
        const wallet = await connectWallet();
        setWalletAddress(wallet.address);
        // Fetch balance
        setBalanceLoading(true);
        let fetchedBalance = '0';
        try {
          const balResult = await getBalance(wallet.address);
          fetchedBalance = balResult.balance;
          setWalletBalance(balResult.balance);
        } catch { setWalletBalance('0'); }
        setBalanceLoading(false);
        // Check self-pay after connecting
        if (wallet.address.toLowerCase() === payment.merchant?.toLowerCase()) {
          toast.error("You can't pay your own invoice. Switch to a different wallet.");
          return;
        }
        // Check balance
        const balNum = parseFloat(fetchedBalance || '0');
        const payAmt = parseFloat(payment.amount);
        if (balNum < payAmt) {
          toast.error(`Insufficient balance. You need ${payment.amount} QIE on QIE Testnet (chain 1983).`);
          return;
        }
        toast.success('Wallet connected! Now processing payment...');
        await payForPayment(payment.id, payment.amount);
        toast.success('Payment sent!');
        const updated = await getPayment(id);
        setPayment(updated);
      } catch (err) {
        const msg = parsePaymentError(err);
        toast.error(msg);
      }
      return;
    }

    setPaying(true);
    try {
      if (!walletAddress) {
        const wallet = await connectWallet();
        setWalletAddress(wallet.address);
        // Fetch balance
        setBalanceLoading(true);
        let fetchedBalance = '0';
        try {
          const balResult = await getBalance(wallet.address);
          fetchedBalance = balResult.balance;
          setWalletBalance(balResult.balance);
        } catch { setWalletBalance('0'); }
        setBalanceLoading(false);
        // Check self-pay after connecting
        if (wallet.address.toLowerCase() === payment.merchant?.toLowerCase()) {
          toast.error("You can't pay your own invoice. Switch to a different wallet.");
          setPaying(false);
          return;
        }
      }
      // Check self-pay for already connected wallet
      if (walletAddress && walletAddress.toLowerCase() === payment.merchant?.toLowerCase()) {
        toast.error("You can't pay your own invoice. Switch to a different wallet.");
        setPaying(false);
        return;
      }
      // Check balance
      const balNum = parseFloat(fetchedBalance || '0');
      const payAmt = parseFloat(payment.amount);
      if (balNum < payAmt) {
        toast.error(`Insufficient balance. You need ${payment.amount} QIE on QIE Testnet (chain 1983).`);
        setPaying(false);
        return;
      }
      await payForPayment(payment.id, payment.amount);
      toast.success('Payment sent!');
      const updated = await getPayment(id);
      setPayment(updated);
    } catch (err) {
      const msg = parsePaymentError(err);
      toast.error(msg);
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
    2: 'bg-[#34D399]',
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
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#FAFAFA] mb-1">Payment Not Found</h2>
          <p className="text-[#A1A1AA] text-sm mb-4">Payment #{id} does not exist or has been removed.</p>
          <Link to="/" className="text-xs text-[#10B981] hover:text-[#34D399] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-6 relative">
          {/* Demo Badge */}
          {isDemo && (
            <div className="flex items-center justify-center gap-1.5 mb-4 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
              <Eye size={12} className="text-amber-400" />
              <span className="text-[10px] font-medium text-amber-400">Demo Payment</span>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="text-lg font-semibold text-[#FAFAFA] mb-1 tracking-tight">Payment #{payment.id}</h1>
            <div className="flex items-center justify-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusDot[payment.status] || 'bg-[#3F3F46]'}`} />
              <span className="text-xs text-[#A1A1AA]">{statusLabel[payment.status] || 'Unknown'}</span>
            </div>
            {polling && payment.status === 0 && (
              <p className="text-xs text-sky-400 mt-1.5 flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Waiting for payment...
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="bg-[#09090B] border border-[#27272A] rounded-lg p-4 text-center mb-5">
            <p className="text-3xl font-bold text-[#10B981] tabular-nums">
              {formatQIEAmount(payment.amount)} QIE
            </p>
            <p className="text-xs text-[#71717A] mt-0.5">{formatUSD(payment.amount)}</p>
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
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-[#27272A]/40 last:border-0">
                <span className="text-xs text-[#71717A]">{item.label}</span>
                {item.isJSX ? item.value : (
                  <span className="text-xs text-[#A1A1AA]">{item.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* Action area based on status */}
          {payment.status === 0 && (
            <>
              {/* Self-pay warning */}
              {walletAddress && walletAddress.toLowerCase() === payment.merchant?.toLowerCase() && (
                <div className="mb-3 flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-400">This is your own invoice</p>
                    <p className="text-xs text-amber-400/70 mt-0.5">Switch to a different wallet to pay this invoice.</p>
                  </div>
                </div>
              )}
              {/* Insufficient balance warning */}
              {walletAddress && walletBalance !== null && parseFloat(walletBalance) < parseFloat(payment.amount) && (
                <div className="mb-3 flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-red-400">Insufficient QIE on QIE Testnet</p>
                    <p className="text-xs text-red-400/70 mt-0.5">
                      Balance: {parseFloat(walletBalance).toFixed(4)} QIE — Need: {payment.amount} QIE on chain 1983.
                      {parseFloat(walletBalance) === 0 && ' Your wallet may be on a different network.'}
                    </p>
                  </div>
                </div>
              )}
              {/* Balance display */}
              {walletAddress && walletBalance !== null && !balanceLoading && (
                <div className="mb-3 flex items-center justify-between px-3 py-2 rounded-md bg-[#09090B] border border-[#27272A]/40">
                  <span className="text-xs text-[#71717A]">Your balance (QIE Testnet)</span>
                  <span className={`text-xs font-mono font-medium ${parseFloat(walletBalance) >= parseFloat(payment.amount) ? 'text-[#34D399]' : 'text-red-400'}`}>
                    {parseFloat(walletBalance).toFixed(4)} QIE
                  </span>
                </div>
              )}
              <button
                onClick={handlePay}
                disabled={paying || (walletAddress && walletAddress.toLowerCase() === payment.merchant?.toLowerCase()) || (walletBalance !== null && parseFloat(walletBalance) < parseFloat(payment.amount))}
              className="w-full h-10 flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md text-sm transition-colors disabled:opacity-60"
            >
              {paying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : isDemo ? (
                <><Wallet className="w-4 h-4" /> Connect Wallet to Pay</>
              ) : (
                <><Wallet className="w-4 h-4" /> Pay {formatQIEAmount(payment.amount)} QIE</>
              )}
            </button>
            </>
          )}

          {(payment.status === 1 || payment.status === 2) && (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#34D399] mx-auto" />
              <p className="text-sm font-semibold text-[#FAFAFA]">
                Payment {payment.status === 2 ? 'Settled' : 'Paid'}
              </p>
              <div className="flex gap-2 justify-center">
                <a
                  href={`${EXPLORER_URL}/address/${payment.customer || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 border border-[#3F3F46] hover:border-[#52525B] rounded-md text-xs text-[#A1A1AA] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Explorer
                </a>
                <Link
                  to={`/pay/${payment.id}`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded-md text-xs text-[#34D399] hover:bg-[rgba(16,185,129,0.2)] transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Invoice
                </Link>
              </div>
            </div>
          )}

          {payment.status === 3 && (
            <div className="text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm font-semibold text-[#FAFAFA]">Payment Refunded</p>
              <p className="text-xs text-[#A1A1AA]">The amount has been refunded to the customer.</p>
            </div>
          )}

          {payment.status === 4 && (
            <div className="text-center space-y-2">
              <XCircle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-sm font-semibold text-[#FAFAFA]">Payment Cancelled</p>
              <p className="text-xs text-[#A1A1AA]">This payment has been cancelled by the merchant.</p>
            </div>
          )}

          {/* QR Code (only for Created) */}
          {payment.status === 0 && (
            <div className="mt-5 pt-4 border-t border-[#27272A] flex justify-center">
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
                <p className="text-xs text-[#71717A]">Scan to Pay</p>
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
