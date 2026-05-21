import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Store,
  DollarSign,
  CreditCard,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  getMerchantPayments,
  getMerchantEarnings,
  isMerchant,
  getProvider,
} from '../utils/contract';
import { STATUS_MAP, STATUS_COLORS, BLOCK_EXPLORER } from '../utils/constants';

export default function MerchantProfile() {
  const { address } = useParams();
  const [merchant, setMerchant] = useState(null);
  const [earnings, setEarnings] = useState('0');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (address) loadMerchantData();
  }, [address]);

  const loadMerchantData = async () => {
    setLoading(true);
    setError(null);
    try {
      const registered = await isMerchant(address);
      if (!registered) {
        setError('This address is not a registered merchant');
        setLoading(false);
        return;
      }

      const [earningsData, paymentsData] = await Promise.all([
        getMerchantEarnings(address),
        getMerchantPayments(address),
      ]);

      setMerchant({ address, registered: true });
      setEarnings(earningsData);
      setPayments(paymentsData.reverse());
    } catch (err) {
      setError('Failed to load merchant data');
    }
    setLoading(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalVolume = payments
    .filter((p) => p.status >= 1)
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const completedPayments = payments.filter((p) => p.status === 2).length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Loader2 size={32} className="animate-spin text-primary-400 mx-auto" />
        <p className="text-gray-400 mt-4">Loading merchant profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="card py-12">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Merchant Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Merchant Header */}
      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Store size={32} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">Merchant Profile</h1>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-mono text-sm">
                {address.slice(0, 8)}...{address.slice(-6)}
              </span>
              <button
                onClick={copyAddress}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {copied ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <a
                href={`${BLOCK_EXPLORER}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
            <span className="text-green-400 text-sm font-medium">
              Verified Merchant
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign size={20} className="text-green-400" />
            <span className="text-gray-400 text-sm">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {parseFloat(earnings).toFixed(4)} QIE
          </p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard size={20} className="text-blue-400" />
            <span className="text-gray-400 text-sm">Total Payments</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{payments.length}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <Store size={20} className="text-primary-400" />
            <span className="text-gray-400 text-sm">Completed</span>
          </div>
          <p className="text-2xl font-bold text-primary-400">
            {completedPayments}
          </p>
        </div>
      </div>

      {/* Payment History */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Payment History</h2>

        {payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No payment history yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-mono text-gray-400">
                      #{payment.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[payment.status]}`}
                    >
                      {STATUS_MAP[payment.status]}
                    </span>
                  </div>
                  <p className="text-sm text-white">
                    {payment.description || 'No description'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {parseFloat(payment.amount).toFixed(4)} QIE
                  </p>
                  <Link
                    to={`/pay/${payment.id}`}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 justify-end mt-1"
                  >
                    View <ExternalLink size={10} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
