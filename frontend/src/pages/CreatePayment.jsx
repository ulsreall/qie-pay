import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet, UserPlus, FileText, ArrowRight, ArrowLeft, CheckCircle2,
  Loader2, Copy, ExternalLink, QrCode
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
      // Email wallet: skip RPC check, go straight to register step
      // isMerchant() will be checked when user clicks Register
      if (emailWallet && emailWallet.address) {
        setAddress(emailWallet.address);
        setStep(1);
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
    <div className="flex items-center gap-1 mb-6">
      {STEP_LABELS.map((label, i) => {
        const done = i < step || (i === 2 && result);
        const active = i === step;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={`w-full h-1.5 rounded-full transition-all ${
              done ? 'bg-[#10B981]' : active ? 'bg-[#10B981]/40' : 'bg-[#18181B]'
            }`} />
            <span className={`text-xs ${active ? 'text-[#A1A1AA]' : 'text-[#52525B]'}`}>{label}</span>
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
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-4 sm:p-6">
          <h1 className="text-lg font-semibold text-[#FAFAFA] text-center mb-1 tracking-tight">Create Payment</h1>
          <p className="text-[#71717A] text-center text-xs mb-5">Set up a new crypto payment request</p>

          <StepIndicator />

          {/* ─── STEP 0: Connect ─── */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
                <Wallet className="w-7 h-7 text-[#10B981]" />
              </div>
              <h2 className="text-base font-semibold text-[#FAFAFA] mb-1">Connect Your Wallet</h2>
              <p className="text-[#A1A1AA] text-xs mb-5 max-w-xs mx-auto">
                Connect your wallet to the QIE Blockchain to start creating payments.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md text-sm transition-colors disabled:opacity-60"
              >
                {connecting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                ) : (
                  <><Wallet className="w-4 h-4" /> Connect Wallet</>
                )}
              </button>
              {!window.ethereum && !emailWallet && (
                <p className="text-red-400 text-xs mt-3">
                  No wallet detected. Please install QIE Wallet or MetaMask, or connect with email on the home page.
                </p>
              )}
            </div>
          )}

          {/* ─── STEP 1: Register ─── */}
          {step === 1 && (
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
                <UserPlus className="w-7 h-7 text-[#10B981]" />
              </div>
              <h2 className="text-base font-semibold text-[#FAFAFA] mb-1">Register as Merchant</h2>
              <p className="text-[#A1A1AA] text-xs mb-1.5 max-w-xs mx-auto">
                Register your wallet address on the QIE Pay smart contract to receive payments.
              </p>
              {address && (
                <p className="text-xs text-[#71717A] font-mono mb-4">{address}</p>
              )}
              {isRegistered ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-xs text-[#34D399]">Already registered</span>
                  </div>
                  <div>
                    <button
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md text-sm transition-colors"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md text-sm transition-colors disabled:opacity-60"
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
            </div>
          )}

          {/* ─── STEP 2: Create Form ─── */}
          {step === 2 && !result && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-[#A1A1AA] mb-1">Description *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Premium subscription"
                  className="w-full px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-md text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#A1A1AA] mb-1">Amount (QIE) *</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-md text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
                  required
                />
                {amount && parseFloat(amount) > 0 && (
                  <p className="text-xs text-[#71717A] mt-1">
                    ≈ {formatUSD(parseFloat(amount))} (at ${getQIEPrice()}/QIE)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-[#A1A1AA] mb-1">Order ID (optional)</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g., ORD-12345"
                  className="w-full px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-md text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 transition-all"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-2 border border-[#3F3F46] hover:border-[#52525B] text-[#A1A1AA] rounded-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md text-sm transition-colors disabled:opacity-60"
                >
                  {creating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                  ) : (
                    <><FileText className="w-4 h-4" /> Create Payment</>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ─── Success Result (simplified) ─── */}
          {step === 2 && result && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-lg bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-[#10B981]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#FAFAFA] mb-0.5">Payment Created</h2>
                <p className="text-xs text-[#A1A1AA]">Payment #{result.paymentId}</p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-lg">
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
                  className="flex items-center gap-1.5 px-3 py-2 border border-[#3F3F46] hover:border-[#52525B] rounded-md text-xs text-[#A1A1AA] transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </button>
                <Link
                  to={`/pay/${result.paymentId}`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded-md text-xs text-[#34D399] hover:bg-[rgba(16,185,129,0.2)] transition-colors"
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
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
