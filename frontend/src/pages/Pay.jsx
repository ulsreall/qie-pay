import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  CreditCard,
  Loader2,
  Check,
  AlertCircle,
  Clock,
  Store,
  Wallet,
  ExternalLink,
} from 'lucide-react';
import {
  connectWallet,
  getPayment,
  payForPayment,
  checkConnection,
} from '../utils/contract';
import { STATUS_MAP, STATUS_COLORS, BLOCK_EXPLORER } from '../utils/constants';

export default function Pay() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    loadPayment();
    checkConnection().then((connected) => {
      if (connected) setWallet(connected);
    });
  }, [id]);

  const loadPayment = async () => {
    setLoading(true);
    try {
      const data = await getPayment(id);
      setPayment(data);
      setAmount(data.amount !== '0.0' ? data.amount : '');
    } catch (err) {
      setError('Payment not found or invalid payment ID');
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    try {
      const result = await connectWallet();
      setWallet({ address: result.address, balance: result.balance });
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setPaying(true);
    setError(null);

    try {
      if (!wallet) {
        await handleConnect();
      }

      const receipt = await payForPayment(id, amount);
      setTxHash(receipt.hash);
      setSuccess(true);
      await loadPayment();
    } catch (err) {
      setError(err.message || 'Payment failed');
    }

    setPaying(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateAddress = (addr) =>
    addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : '-';

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Loader2 size={32} className="animate-spin text-primary-400 mx-auto" />
        <p className="text-gray-400 mt-4">Loading payment details...</p>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="card py-12">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Payment Not Found</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const isPayable = payment?.status === 0;
  const isPaid = payment?.status === 1;
  const isSettled = payment?.status === 2;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
              <CreditCard size={24} className="text-primary-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Payment Request</h1>
              <p className="text-sm text-gray-400">Payment #{id}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[payment.status]}`}
          >
            {STATUS_MAP[payment.status]}
          </span>
        </div>

        {/* Payment Details */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Description</span>
            <span className="font-medium text-right">
              {payment.description || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Order ID</span>
            <span className="font-mono text-sm">
              {payment.orderId || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Merchant</span>
            <a
              href={`/merchant/${payment.merchant}`}
              className="text-primary-400 hover:text-primary-300 font-mono text-sm flex items-center gap-1"
            >
              {truncateAddress(payment.merchant)}
              <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Created</span>
            <span className="text-sm">{formatDate(payment.createdAt)}</span>
          </div>
          {payment.amount !== '0.0' && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Amount</span>
              <span className="text-2xl font-bold text-white">
                {parseFloat(payment.amount).toFixed(4)} QIE
              </span>
            </div>
          )}
          {payment.fee !== '0.0' && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Platform Fee</span>
              <span className="text-sm text-gray-300">
                {parseFloat(payment.fee).toFixed(4)} QIE
              </span>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Check size={18} className="text-green-400" />
              <span className="text-green-300 font-medium">
                Payment Successful!
              </span>
            </div>
            {txHash && (
              <a
                href={`${BLOCK_EXPLORER}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                View on Explorer <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Payment Form */}
        {isPayable && !success && (
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (QIE)
              </label>
              <div className="relative">
                <Wallet
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in QIE"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {!wallet && (
              <button
                type="button"
                onClick={handleConnect}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Wallet size={18} />
                Connect Wallet First
              </button>
            )}

            <button
              type="submit"
              disabled={paying || !wallet}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-lg"
            >
              {paying ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Pay {amount ? `${parseFloat(amount).toFixed(4)} QIE` : ''}
                </>
              )}
            </button>
          </form>
        )}

        {/* Already Paid/Settled Info */}
        {isPaid && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Check size={18} className="text-green-400" />
              <span className="text-green-300">
                This payment has been paid. Awaiting settlement by merchant.
              </span>
            </div>
          </div>
        )}

        {isSettled && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Check size={18} className="text-blue-400" />
              <span className="text-blue-300">
                This payment has been settled. Funds transferred to merchant.
              </span>
            </div>
            {payment.settledAt > 0 && (
              <p className="text-sm text-gray-400 mt-2">
                Settled on {formatDate(payment.settledAt)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
