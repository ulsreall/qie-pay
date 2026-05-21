import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, UserPlus, FileText, ArrowRight, ArrowLeft, CheckCircle2,
  Loader2, Copy, ExternalLink, Share2, QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';
import PaymentQRCode from '../components/QRCode';
import {
  connectWallet, checkConnection, isMerchant, registerMerchant, createPayment
} from '../utils/contract';
import { formatUSD, getQIEPrice } from '../utils/currency';

const STEP_LABELS = ['Connect Wallet', 'Register', 'Create Payment'];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

export default function CreatePayment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
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

  const goStep = (next) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  /* ─── Step 1: Connect ─── */
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const wallet = await connectWallet();
      setAddress(wallet.address);
      toast.success('Wallet connected!');
      const registered = await isMerchant(wallet.address);
      setIsRegistered(registered);
      goStep(registered ? 2 : 1);
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
      goStep(2);
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
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                done
                  ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                  : active
                    ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30'
                    : 'bg-white/5 text-gray-600 ring-1 ring-white/10'
              }`}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${active ? 'text-white' : 'text-gray-600'}`}>{label}</span>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 rounded ${i < step ? 'bg-green-500/40' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl"
      >
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 md:p-10">
          <h1 className="text-2xl font-bold text-white text-center mb-2">Create Payment</h1>
          <p className="text-gray-500 text-center text-sm mb-6">Set up a new crypto payment request</p>

          <StepIndicator />

          <AnimatePresence mode="wait" custom={direction}>
            {/* ─── STEP 0: Connect ─── */}
            {step === 0 && (
              <motion.div
                key="connect"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-purple-500/10 flex items-center justify-center ring-1 ring-purple-500/20">
                  <Wallet className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
                <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
                  Connect your wallet to the QIE Blockchain to start creating payments.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all disabled:opacity-60"
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
              </motion.div>
            )}

            {/* ─── STEP 1: Register ─── */}
            {step === 1 && (
              <motion.div
                key="register"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-cyan-500/10 flex items-center justify-center ring-1 ring-cyan-500/20">
                  <UserPlus className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Register as Merchant</h2>
                <p className="text-gray-400 text-sm mb-2 max-w-sm mx-auto">
                  Register your wallet address on the QIE Pay smart contract to receive payments.
                </p>
                {address && (
                  <p className="text-xs text-gray-600 font-mono mb-6">{address}</p>
                )}
                {isRegistered ? (
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Already registered</span>
                    </div>
                    <div>
                      <button
                        onClick={() => goStep(2)}
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-xl"
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
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-60"
                    >
                      {registering ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Registering...</>
                      ) : (
                        <><UserPlus className="w-5 h-5" /> Register Now</>
                      )}
                    </button>
                    <button
                      onClick={() => goStep(0)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mx-auto transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── STEP 2: Create Form or Result ─── */}
            {step === 2 && !result && (
              <motion.div
                key="form"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleCreate} className="space-y-5">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Description *</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Premium subscription"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Amount (QIE) *</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all"
                      required
                    />
                    {amount && parseFloat(amount) > 0 && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        ≈ {formatUSD(parseFloat(amount))} (at ${getQIEPrice()}/QIE)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Order ID (optional)</label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g., ORD-12345"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => goStep(1)}
                      className="px-5 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all disabled:opacity-60"
                    >
                      {creating ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</>
                      ) : (
                        <><FileText className="w-5 h-5" /> Create Payment</>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ─── Success Result ─── */}
            {step === 2 && result && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center ring-1 ring-green-500/20">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Payment Created!</h2>
                  <p className="text-gray-400 text-sm">Payment #{result.paymentId}</p>
                </div>

                <PaymentQRCode value={result.url} size={180} />

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={copyLink}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-all"
                  >
                    <Copy className="w-4 h-4" /> Copy Link
                  </button>
                  {navigator.share && (
                    <button
                      onClick={() => navigator.share({ url: result.url }).catch(() => {})}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-all"
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  )}
                  <Link
                    to={`/pay/${result.paymentId}`}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm text-purple-400 hover:bg-purple-500/20 transition-all"
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
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  + Create another payment
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
