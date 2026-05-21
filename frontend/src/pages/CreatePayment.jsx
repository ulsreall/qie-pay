import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Hash,
  Link as LinkIcon,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import {
  connectWallet,
  ensureMerchant,
  createPayment,
  checkConnection,
} from '../utils/contract';

export default function CreatePayment() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkConnection().then((connected) => {
      if (connected) setWallet(connected);
    });
  }, []);

  const handleConnect = async () => {
    try {
      const result = await connectWallet();
      setWallet({ address: result.address });
      await ensureMerchant();
    } catch (err) {
      setError(err.message);
    }
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
      if (!wallet) {
        await handleConnect();
      }

      await ensureMerchant();
      const { paymentId } = await createPayment(description, orderId || `ORD-${Date.now()}`);

      const paymentUrl = `${window.location.origin}/pay/${paymentId}`;
      setResult({ paymentId, paymentUrl });
    } catch (err) {
      setError(err.message || 'Failed to create payment');
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

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {!result ? (
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

            {!wallet && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  You need to connect your wallet and register as a merchant to
                  create payments.
                </p>
              </div>
            )}

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
                <>
                  {wallet ? 'Create Payment' : 'Connect Wallet & Create'}
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check size={18} className="text-green-400" />
                <span className="text-green-300 font-medium">
                  Payment Created Successfully!
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Payment ID: #{result.paymentId}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Link
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

            <div className="flex items-center gap-2">
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
