import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Plus,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  connectWallet,
  ensureMerchant,
  getMerchantPayments,
  getMerchantEarnings,
  settlePayment,
  cancelPayment,
  checkConnection,
} from '../utils/contract';
import { STATUS_MAP, STATUS_COLORS } from '../utils/constants';

export default function Dashboard() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [earnings, setEarnings] = useState('0');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    setError(null);
    try {
      const connected = await checkConnection();
      if (!connected) {
        setLoading(false);
        return;
      }
      setWallet(connected);
      await loadData(connected.address);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const loadData = async (address) => {
    try {
      const [earningsData, paymentsData] = await Promise.all([
        getMerchantEarnings(address),
        getMerchantPayments(address),
      ]);
      setEarnings(earningsData);
      setPayments(paymentsData.reverse());
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleConnect = async () => {
    try {
      const result = await connectWallet();
      setWallet({ address: result.address, balance: result.balance });

      setRegistering(true);
      await ensureMerchant();
      setRegistering(false);

      await loadData(result.address);
    } catch (err) {
      setError(err.message);
      setRegistering(false);
    }
  };

  const handleSettle = async (paymentId) => {
    setActionLoading((prev) => ({ ...prev, [`settle_${paymentId}`]: true }));
    try {
      await settlePayment(paymentId);
      await loadData(wallet.address);
    } catch (err) {
      alert('Settlement failed: ' + err.message);
    }
    setActionLoading((prev) => ({ ...prev, [`settle_${paymentId}`]: false }));
  };

  const handleCancel = async (paymentId) => {
    if (!confirm('Are you sure you want to cancel this payment?')) return;
    setActionLoading((prev) => ({ ...prev, [`cancel_${paymentId}`]: true }));
    try {
      await cancelPayment(paymentId);
      await loadData(wallet.address);
    } catch (err) {
      alert('Cancellation failed: ' + err.message);
    }
    setActionLoading((prev) => ({ ...prev, [`cancel_${paymentId}`]: false }));
  };

  const handleRefresh = async () => {
    if (wallet) {
      setLoading(true);
      await loadData(wallet.address);
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPaid = payments
    .filter((p) => p.status >= 1)
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalSettled = payments
    .filter((p) => p.status === 2)
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  if (!wallet && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="card max-w-md mx-auto py-12">
          <CreditCard size={48} className="text-primary-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">
            Merchant Dashboard
          </h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to access the merchant dashboard
          </p>
          <button onClick={handleConnect} className="btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Manage your payments and earnings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/create')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Create Payment
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {registering && (
        <div className="mb-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg flex items-center gap-3">
          <Loader2 size={20} className="text-primary-400 animate-spin" />
          <p className="text-primary-300 text-sm">
            Registering as merchant...
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Total Earnings</span>
            <DollarSign size={20} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">
            {parseFloat(earnings).toFixed(4)} QIE
          </p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Total Volume</span>
            <TrendingUp size={20} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-400">
            {totalPaid.toFixed(4)} QIE
          </p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Payments</span>
            <CreditCard size={20} className="text-primary-400" />
          </div>
          <p className="text-3xl font-bold text-primary-400">
            {payments.length}
          </p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent Payments</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary-400" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">No payments yet</p>
            <Link to="/create" className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} />
              Create Your First Payment
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 text-sm font-medium pb-3 px-3">
                    ID
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium pb-3 px-3">
                    Description
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium pb-3 px-3">
                    Order ID
                  </th>
                  <th className="text-right text-gray-400 text-sm font-medium pb-3 px-3">
                    Amount
                  </th>
                  <th className="text-center text-gray-400 text-sm font-medium pb-3 px-3">
                    Status
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium pb-3 px-3">
                    Date
                  </th>
                  <th className="text-right text-gray-400 text-sm font-medium pb-3 px-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-4 px-3">
                      <span className="text-sm font-mono text-gray-300">
                        #{payment.id}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="text-sm text-white">
                        {payment.description || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="text-sm text-gray-400 font-mono">
                        {payment.orderId || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <span className="text-sm font-semibold">
                        {parseFloat(payment.amount).toFixed(4)} QIE
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[payment.status]}`}
                      >
                        {STATUS_MAP[payment.status]}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="text-sm text-gray-400">
                        {formatDate(payment.createdAt)}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/pay/${payment.id}`}
                          className="text-primary-400 hover:text-primary-300 text-xs flex items-center gap-1"
                        >
                          Link <ExternalLink size={12} />
                        </Link>
                        {payment.status === 1 && (
                          <button
                            onClick={() => handleSettle(payment.id)}
                            disabled={actionLoading[`settle_${payment.id}`]}
                            className="text-green-400 hover:text-green-300 text-xs disabled:opacity-50"
                          >
                            {actionLoading[`settle_${payment.id}`] ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              'Settle'
                            )}
                          </button>
                        )}
                        {payment.status === 0 && (
                          <button
                            onClick={() => handleCancel(payment.id)}
                            disabled={actionLoading[`cancel_${payment.id}`]}
                            className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
