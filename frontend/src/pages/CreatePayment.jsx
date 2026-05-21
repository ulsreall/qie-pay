import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet, UserPlus, FileText, ArrowRight, ArrowLeft, CheckCircle2,
  Loader2, Copy, ExternalLink, Share2, QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  connectWallet, checkConnection, isMerchant, registerMerchant, createPayment
} from '../utils/contract';
import { formatUSD, getQIEPrice } from '../utils/currency';

const STEP_LABELS = ['Connect Wallet', 'Register', 'Create Payment'];

export default function CreatePayment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Form
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [orderId, setOrderId] = useState('');

  // States
  const [connecting, setConnecting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);

  // Check existing connection on mount
  useEffect(() => {
    (async () => {
      try {
        const conn = await checkConnection();
        if (conn) {
          setAddress(conn.address);
          const registered = await isMerchant(conn.address);
          setIsRegistered(registered);
          setStep(registered ? 2 : 1);
        }
      } catch {
        // no wallet connected
      }
    })();
  }, []);

  /* ─── Step 1: Connect ─── */
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const wallet = await connectWallet();
      setAddress(wallet.address);
      toast.success('Wallet connected!');
      const registered = await isMerchant(wallet.address);
      setIsRegistered(registered);
      setStep(registered ? 2 : 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  /* ─── Step 2: Register ─── */
  const handleRegister = async () => {
    setRegistering(true);
    try {
      if (!isRegistered) {
        await registerMerchant();
        toast.success('Merchant registered!');
      }
      setIsRegistered(true);
      setStep(2);
    } catch (err) {
      toast.error(err?.reason || err?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  /* ─── Step 3: Create ─── */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!description.trim()) return toast.error('Description is required');
    if (!amount || parseFloat(amount) <= 0) return toast.error('Enter a valid amount');

    setCreating(true);
    try {
      const res = await createPayment(description.trim(), orderId.trim(), parseFloat(amount));
      setResult({
        paymentId: res.paymentId,
        url: `${window.location.origin}/pay/${res.paymentId}`,
      });
      toast.success('Payment created!');
    } catch (err) {
      toast.error(err?.reason || err?.message || 'Failed to create payment');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(result.url);
      toast.success('Link copied!');
    } catch {
      toast.error('Copy failed');
    }
  };

  /* ─── Step Indicator ─── */
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-10">
      {STEP_LABELS.map((label, i) => {
        const active = i === step;
        const done = i < step || (i === 2 && result);
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                done
                  ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30'
                  : active
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-500 ring-1 ring-slate-700'
              }`}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${active ? 'text-slate-50' : 'text-slate-500'}`}>{label}</span>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 rounded ${i < step ? 'bg-emerald-500/40' : 'bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-900 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 md:p-10">
          <h1 className="text-2xl font-bold text-slate-50 text-center mb-2">Create Payment</h1>
          <p className="text-slate-500 text-center text-sm mb-6">Set up a new crypto payment request</p>

          <StepIndicator />

          {/* ─── STEP 0: Connect ─── */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-50 mb-2">Connect Your Wallet</h2>
              <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
                Connect your wallet to the QIE Blockchain to start creating payments.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {connecting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</>
                ) : (
                  <><Wallet className="w-5 h-5" /> Connect Wallet</>
                )}
              </button>
              {!window.ethereum && (
                <p className="text-red-400 text-xs mt-4">
                  No wallet detected. Please install QIE Wallet or MetaMask.
                </p>
              )}
            </div>
          )}

          {/* ─── STEP 1: Register ─── */}
          {step === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <UserPlus className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-50 mb-2">Register as Merchant</h2>
              <p className="text-slate-400 text-sm mb-2 max-w-sm mx-auto">
                Register your wallet address on the QIE Pay smart contract to receive payments.
              </p>
              {address && (
                <p className="text-xs text-slate-500 font-mono mb-6">{address}</p>
              )}
              {isRegistered ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-400">Already registered</span>
                  </div>
                  <div>
                    <button
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Continue <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-60"
                  >
                    {registering ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Registering...</>
                    ) : (
                      <><UserPlus className="w-5 h-5" /> Register Now</>
                    )}
                  </button>
                  <button
                    onClick={() => setStep(0)}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mx-auto transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 2: Create Form ─── */}
          {step === 2 && !result && (
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Description *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Premium subscription"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Amount (QIE) *</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  required
                />
                {amount && parseFloat(amount) > 0 && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    ≈ {formatUSD(parseFloat(amount))} (at ${getQIEPrice()}/QIE)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Order ID (optional)</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g., ORD-12345"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 border border-slate-600 hover:border-slate-500 text-slate-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-60"
                >
                  {creating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</>
                  ) : (
                    <><FileText className="w-5 h-5" /> Create Payment</>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ─── Success Result ─── */}
          {step === 2 && result && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-50 mb-1">Payment Created!</h2>
                <p className="text-slate-400 text-sm">Payment #{result.paymentId}</p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG
                    value={result.url}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#10B981"
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-600 hover:border-slate-500 rounded-lg text-sm text-slate-200 transition-colors"
                >
                  <Copy className="w-4 h-4" /> Copy Link
                </button>
                {navigator.share && (
                  <button
                    onClick={() => navigator.share({ url: result.url }).catch(() => {})}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-600 hover:border-slate-500 rounded-lg text-sm text-slate-200 transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                )}
                <Link
                  to={`/pay/${result.paymentId}`}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> View Invoice
                </Link>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setDescription('');
                  setAmount('');
                  setOrderId('');
                }}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                + Create another payment
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
