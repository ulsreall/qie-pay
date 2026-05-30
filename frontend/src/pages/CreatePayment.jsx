import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet, UserPlus, FileText, ArrowRight, ArrowLeft, CheckCircle2,
  Loader2, Copy, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  connectWallet, checkConnection, isMerchant, registerMerchant, createPayment
} from '../utils/contract';
import { formatUSD, getQIEPrice } from '../utils/currency';
import { useEmailWallet } from '../utils/email-wallet';

const STEP_LABELS = ['Connect Wallet', 'Register', 'Create Payment'];

export default function CreatePayment() {
  const navigate = useNavigate();
  const { emailWallet } = useEmailWallet();
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

  // Check existing connection on mount — email wallet first, then extension
  useEffect(() => {
    (async () => {
      // Email wallet: check merchant status, skip to create if already registered
      if (emailWallet && emailWallet.address) {
        setAddress(emailWallet.address);
        try {
          const registered = await isMerchant(emailWallet.address);
          setIsRegistered(registered);
          setStep(registered ? 2 : 1);
        } catch {
          // If RPC check fails, show register step
          setStep(1);
        }
        return;
      }
      // Extension wallet: check connection + merchant status
      try {
        const conn = await checkConnection();
        if (conn && !conn.isDemo) {
          setAddress(conn.address);
          const registered = await isMerchant(conn.address);
          setIsRegistered(registered);
          setStep(registered ? 2 : 1);
        }
      } catch {
        // no wallet connected
      }
    })();
  }, [emailWallet]);

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
      const msg = err?.reason || err?.message || 'Registration failed';
      // If already registered, treat as success and move to create step
      if (msg.includes('already registered')) {
        setIsRegistered(true);
        setStep(2);
        toast('Already registered — continuing...');
      } else {
        toast.error(msg);
      }
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

  /* ─── Step Indicator (horizontal bar) ─── */
  const StepIndicator = () => (
    <div className="flex items-center gap-1.5 mb-6">
      {STEP_LABELS.map((label, i) => {
        const done = i < step || (i === 2 && result);
        const active = i === step;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={`w-full h-1.5 rounded-full transition-all duration-300 ${
              done ? 'bg-gradient-to-r from-[#10B981] to-[#34D399]' : active ? 'bg-[#10B981]/30' : 'bg-[#18181B]'
            }`} />
            <span className={`text-[10px] font-medium transition-colors ${active ? 'text-[#A1A1AA]' : 'text-[#52525B]'}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen bg-[#09090B] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
        >
          {/* Subtle gradient border glow */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[rgba(16,185,129,0.15)] via-transparent to-[rgba(56,189,248,0.06)]" />
          <div className="relative bg-[#111113] border border-[#27272A] rounded-2xl p-5 sm:p-7">
            <div className="text-center mb-5">
              <h1 className="text-lg font-semibold text-[#FAFAFA] tracking-tight">Create Payment</h1>
              <p className="text-[#71717A] text-xs mt-0.5">Set up a new crypto payment request</p>
            </div>

            <StepIndicator />

            {/* ─── STEP 0: Connect ─── */}
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[rgba(16,185,129,0.08)] flex items-center justify-center glow-emerald-sm">
                  <Wallet className="w-8 h-8 text-[#10B981]" />
                </div>
                <h2 className="text-base font-semibold text-[#FAFAFA] mb-1">Connect Your Wallet</h2>
                <p className="text-[#A1A1AA] text-xs mb-6 max-w-xs mx-auto leading-relaxed">
                  Connect your wallet to the QIE Blockchain to start creating payments.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg text-sm transition-all hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.4)] disabled:opacity-60"
                >
                  {connecting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                  ) : (
                    <><Wallet className="w-4 h-4" /> Connect Wallet</>
                  )}
                </button>
                {!window.ethereum && !emailWallet && (
                  <p className="text-red-400/80 text-xs mt-4">
                    No wallet detected. Please install QIE Wallet or MetaMask, or connect with email on the home page.
                  </p>
                )}
              </motion.div>
            )}

            {/* ─── STEP 1: Register ─── */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[rgba(16,185,129,0.08)] flex items-center justify-center glow-emerald-sm">
                  <UserPlus className="w-8 h-8 text-[#10B981]" />
                </div>
                <h2 className="text-base font-semibold text-[#FAFAFA] mb-1">Register as Merchant</h2>
                <p className="text-[#A1A1AA] text-xs mb-1.5 max-w-xs mx-auto leading-relaxed">
                  Register your wallet address on the QIE Pay smart contract to receive payments.
                </p>
                {address && (
                  <p className="text-xs text-[#71717A] font-mono mb-4">{address}</p>
                )}
                {isRegistered ? (
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                      <span className="text-xs text-[#34D399]">Already registered</span>
                    </div>
                    <div>
                      <button
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg text-sm transition-all hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.4)]"
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg text-sm transition-all hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.4)] disabled:opacity-60"
                    >
                      {registering ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
                      ) : (
                        <><UserPlus className="w-4 h-4" /> Register Now</>
                      )}
                    </button>
                    <button
                      onClick={() => setStep(0)}
                      className="flex items-center gap-1 text-xs text-[#71717A] hover:text-[#A1A1AA] mx-auto transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" /> Back
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── STEP 2: Create Form ─── */}
            {step === 2 && !result && (
              <motion.form
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleCreate}
                className="space-y-4"
              >
                <div className="input-group">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder=" "
                    required
                  />
                  <label>Description *</label>
                </div>

                <div className="input-group">
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder=" "
                    required
                  />
                  <label>Amount (QIE) *</label>
                  {amount && parseFloat(amount) > 0 && (
                    <p className="text-xs text-[#71717A] mt-2 pl-px">
                      ≈ {formatUSD(parseFloat(amount))} (at ${getQIEPrice()}/QIE)
                    </p>
                  )}
                </div>

                <div className="input-group">
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder=" "
                  />
                  <label>Order ID (optional)</label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-3.5 py-2.5 border border-[#3F3F46] hover:border-[#52525B] hover:bg-[#18181B] text-[#A1A1AA] rounded-lg transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg text-sm transition-all hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.4)] disabled:opacity-60"
                  >
                    {creating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                    ) : (
                      <><FileText className="w-4 h-4" /> Create Payment</>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* ─── Success Result (simplified) ─── */}
            {step === 2 && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-5"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(16,185,129,0.08)] flex items-center justify-center glow-emerald-sm">
                  <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#FAFAFA] mb-0.5">Payment Created</h2>
                  <p className="text-xs text-[#A1A1AA]">Payment #{result.paymentId}</p>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl shadow-lg shadow-black/20">
                    <QRCodeSVG
                      value={result.url}
                      size={140}
                      bgColor="#ffffff"
                      fgColor="#10B981"
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-[#3F3F46] hover:border-[#52525B] hover:bg-[#18181B] rounded-lg text-xs text-[#A1A1AA] transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </button>
                  <Link
                    to={`/pay/${result.paymentId}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] rounded-lg text-xs text-[#34D399] hover:bg-[rgba(16,185,129,0.15)] transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Invoice
                  </Link>
                </div>

                <button
                  onClick={() => {
                    setResult(null);
                    setDescription('');
                    setAmount('');
                    setOrderId('');
                  }}
                  className="text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors"
                >
                  + Create another payment
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
