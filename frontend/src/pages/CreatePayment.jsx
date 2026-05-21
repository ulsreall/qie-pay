import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Hash,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import {
  connectWallet,
  createPayment,
  checkConnection,
  isMerchant,
  getContract,
} from '../utils/contract';

export default function CreatePayment() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [merchantRegistered, setMerchantRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1=connect, 2=register, 3=create

  useEffect(() => {
    checkConnection().then((connected) => {
      if (connected) {
        setWallet(connected);
        checkMerchantStatus(connected.address);
      }
    });
  }, []);

  const checkMerchantStatus = async (address) => {
    try {
      const registered = await isMerchant(address);
      setMerchantRegistered(registered);
      if (registered) setStep(3);
      else setStep(2);
    } catch (err) {
      console.error('Failed to check merchant status:', err);
    }
  };

  const handleConnect = async () => {
    try {
      setError(null);
      const result = await connectWallet();
      setWallet({ address: result.address });
      await checkMerchantStatus(result.address);
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setError(null);
    try {
      if (!wallet) await handleConnect();

      const contract = await getContract();
      const tx = await contract.registerMerchant();
      await tx.wait();

      setMerchantRegistered(true);
      setStep(3);
    } catch (err) {
      if (err.message?.includes('already registered')) {
        setMerchantRegistered(true);
        setStep(3);
      } else {
        setError('Registration failed. Please try again.');
      }
    }
    setRegistering(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!wallet) await handleConnect();
      if (!merchantRegistered) {
        setError('Please register as a merchant first');
        setLoading(false);
        return;
      }

      const { paymentId } = await createPayment(description, orderId || `ORD-${Date.now()}`);
      const paymentUrl = `${window.location.origin}/pay/${paymentId}`;
      setResult({ paymentId, paymentUrl });
    } catch (err) {
      console.error('Create payment error:', err);
      setError('Failed to create payment. Please check your wallet and try again.');
    }

    setLoading(false);
  };

  const copyLink = () => {
    if (result?.paymentUrl) {
      navigator.clipboard.writeText(result.paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateAnother = () => {
    setResult(null);
    setDescription('');
    setOrderId('');
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="card">
        <h1 className="text-2xl font-bold mb-2">Create Payment Request</h1>
        <p className="text-gray-400 mb-8">
          Generate a payment link to share with your customers
        </p>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Step Indicators */}
        <div className="flex items-center gap-4 mb-8">
          <StepIndicator
            number={1}
            label="Connect"
            active={step >= 1}
            done={!!wallet}
          />
          <div className="flex-1 h-px bg-gray-700" />
          <StepIndicator
            number={2}
            label="Register"
            active={step >= 2}
            done={merchantRegistered}
          />
          <div className="flex-1 h-px bg-gray-700" />
          <StepIndicator
            number={3}
            label="Create"
            active={step >= 3}
            done={!!result}
          />
        </div>

        {/* Step 1: Connect Wallet */}
        {!wallet && (
          <div className="text-center py-8">
            <Wallet size={48} className="text-primary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-400 mb-6">
              Connect QIE Wallet or MetaMask to get started
            </p>
            <button onClick={handleConnect} className="btn-primary px-8 py-3">
              Connect Wallet
            </button>
          </div>
        )}

        {/* Step 2: Register as Merchant */}
        {wallet && !merchantRegistered && (
          <div className="text-center py-8">
            <UserPlus size={48} className="text-primary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Register as Merchant</h3>
            <p className="text-gray-400 mb-2">
              One-time registration to start accepting payments
            </p>
            <p className="text-xs text-gray-500 mb-6 font-mono">
              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            </p>
            <button
              onClick={handleRegister}
              disabled={registering}
              className="btn-primary px-8 py-3 flex items-center gap-2 mx-auto"
            >
              {registering ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Register Now
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Create Payment */}
        {wallet && merchantRegistered && !result && (
          <>
            <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              <span className="text-green-300 text-sm">
                Merchant registered &middot; {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <div className="relative">
                  <FileText
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Premium subscription, T-shirt order..."
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Order ID (optional)
                </label>
                <div className="relative">
                  <Hash
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g., ORD-12345"
                    className="input-field pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated if left empty
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating Payment...
                  </>
                ) : (
                  'Create Payment'
                )}
              </button>
            </form>
          </>
        )}

        {/* Success */}
        {result && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-green-300 mb-1">
                Payment Created!
              </h3>
              <p className="text-gray-400">
                Payment ID: <span className="text-white font-mono">#{result.paymentId}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Share this link with your customer
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-lg px-4 py-3 border border-gray-600 text-sm text-gray-300 font-mono truncate">
                  {result.paymentUrl}
                </div>
                <button
                  onClick={copyLink}
                  className="btn-secondary px-4 py-3 flex items-center gap-2"
                >
                  {copied ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={result.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} />
                Preview Payment Page
              </a>
              <button
                onClick={handleCreateAnother}
                className="btn-primary flex-1"
              >
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ number, label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
          done
            ? 'bg-green-500 text-white'
            : active
            ? 'bg-primary-500 text-white'
            : 'bg-gray-700 text-gray-400'
        }`}
      >
        {done ? <Check size={16} /> : number}
      </div>
      <span
        className={`text-sm font-medium ${
          done ? 'text-green-300' : active ? 'text-white' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
