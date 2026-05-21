import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, BadgeCheck, CreditCard, TrendingUp, Share2, Copy,
  Plus, Edit3, Trash2, X, Loader2, ExternalLink, ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { connectWallet, checkConnection, isMerchant, getMerchantPayments, getMerchantEarnings, createPayment, ensureMerchant } from '../utils/contract';
import { formatUSD, getQIEPrice } from '../utils/currency';
import { EXPLORER_URL } from '../utils/constants';

const GRADIENTS = [
  'from-emerald-500 to-emerald-700',
  'from-sky-500 to-sky-700',
  'from-amber-500 to-amber-700',
  'from-pink-500 to-pink-700',
  'from-violet-500 to-violet-700',
  'from-cyan-500 to-cyan-700',
  'from-rose-500 to-rose-700',
  'from-teal-500 to-teal-700',
];

function getGradient(index) {
  return GRADIENTS[index % GRADIENTS.length];
}

const STORAGE_PREFIX = 'storefront_';

function getStoreKey(address) {
  return `${STORAGE_PREFIX}${address?.toLowerCase()}`;
}

function loadProducts(address) {
  try {
    const raw = localStorage.getItem(getStoreKey(address));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProducts(address, products) {
  localStorage.setItem(getStoreKey(address), JSON.stringify(products));
}

export default function Storefront() {
  const { address } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [merchantExists, setMerchantExists] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ payments: 0, earnings: '0' });

  const [showConfig, setShowConfig] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');

  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const w = await checkConnection();
        if (w) {
          setWallet(w);
          setIsOwner(w.address.toLowerCase() === address?.toLowerCase());
        }

        const exists = await isMerchant(address);
        setMerchantExists(exists);

        if (exists) {
          setProducts(loadProducts(address));

          try {
            const payments = await getMerchantPayments(address);
            const earnings = await getMerchantEarnings(address);
            setStats({
              payments: payments.length,
              earnings: parseFloat(earnings).toFixed(4),
            });
          } catch {}
        }
      } catch (err) {
        console.error('Storefront init error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [address]);

  useEffect(() => {
    if (!showConfig && address) {
      setProducts(loadProducts(address));
    }
  }, [showConfig, address]);

  const handleConnect = async () => {
    try {
      const w = await connectWallet();
      setWallet(w);
      setIsOwner(w.address.toLowerCase() === address?.toLowerCase());
      toast.success('Wallet connected');
    } catch (err) {
      toast.error(err.message || 'Failed to connect');
    }
  };

  const shareUrl = () => {
    const url = `${window.location.origin}/store/${address}`;
    navigator.clipboard.writeText(url);
    toast.success('Storefront URL copied!');
  };

  const handlePay = async (product) => {
    if (!wallet) {
      toast.error('Connect your wallet to pay');
      return;
    }

    try {
      setPayingId(product.id);
      await ensureMerchant();

      const description = `Storefront: ${product.name}`;
      const orderId = `STORE-${product.id}-${Date.now()}`;

      const res = await createPayment(description, orderId, product.price);
      toast.success('Payment created!');
      navigate(`/pay/${res.paymentId}`);
    } catch (err) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setPayingId(null);
    }
  };

  const openAdd = () => {
    setEditItem(null);
    setFormName('');
    setFormDesc('');
    setFormPrice('');
    setShowConfig(true);
  };

  const openEdit = (product) => {
    setEditItem(product);
    setFormName(product.name);
    setFormDesc(product.description || '');
    setFormPrice(product.price.toString());
    setShowConfig(true);
  };

  const deleteProduct = (id) => {
    const next = products.filter(p => p.id !== id);
    saveProducts(address, next);
    setProducts(next);
    toast('Product removed', { icon: '🗑️' });
  };

  const saveProduct = () => {
    if (!formName.trim()) return toast.error('Enter product name');
    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) return toast.error('Enter valid price');

    let next;
    if (editItem) {
      next = products.map(p =>
        p.id === editItem.id
          ? { ...p, name: formName.trim(), description: formDesc.trim(), price }
          : p
      );
    } else {
      const id = `prod-${Date.now()}`;
      next = [...products, { id, name: formName.trim(), description: formDesc.trim(), price }];
    }

    saveProducts(address, next);
    setProducts(next);
    setShowConfig(false);
    toast.success(editItem ? 'Product updated' : 'Product added');
  };

  const truncAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : '';

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Not a merchant
  if (!merchantExists) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col items-center justify-center px-4 text-center">
        <Store className="w-16 h-16 text-slate-700 mb-4" />
        <h2 className="text-xl font-bold mb-2">Merchant Not Found</h2>
        <p className="text-slate-400 max-w-md">
          The address <code className="text-emerald-400 text-sm">{truncAddr}</code> is not registered as a merchant.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      {/* Hero banner */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Store className="w-7 h-7 text-emerald-500" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-slate-50">
                    {truncAddr}
                    <BadgeCheck className="w-6 h-6 text-emerald-400" />
                  </h1>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                    Verified Merchant
                  </span>
                </div>
              </div>

              <div className="flex gap-6 mt-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400">Total Payments</p>
                  <p className="text-lg font-bold text-slate-50">{stats.payments}</p>
                </div>
                <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400">Earnings</p>
                  <p className="text-lg font-bold text-emerald-400">{stats.earnings} QIE</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={shareUrl}
                className="inline-flex items-center gap-2 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              {wallet ? (
                <span className="inline-flex items-center text-xs text-slate-500 font-mono border border-slate-700 rounded-lg px-4 py-2.5">
                  {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
                </span>
              ) : (
                <button
                  onClick={handleConnect}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-50">
            <ShoppingBag className="w-5 h-5 text-emerald-500" /> Products
          </h2>
          {isOwner && (
            <button
              onClick={openAdd}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4 py-2.5 text-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Configure Store
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">
              This merchant hasn't set up their storefront yet
            </h3>
            {isOwner && (
              <button
                onClick={openAdd}
                className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-6 py-2.5 text-sm transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-1" /> Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden group"
              >
                {/* Image placeholder */}
                <div className={`h-40 bg-gradient-to-br ${getGradient(index)} flex items-center justify-center`}>
                  <span className="text-5xl font-bold text-white/30">{product.name[0]}</span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-lg text-slate-50">{product.name}</h3>
                    {isOwner && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(product)}
                          className="w-7 h-7 rounded-lg hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                  )}

                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-emerald-400 font-bold text-xl">{product.price.toFixed(4)} QIE</p>
                      <p className="text-slate-500 text-xs">~{formatUSD(product.price)}</p>
                    </div>
                    <button
                      onClick={() => handlePay(product)}
                      disabled={payingId === product.id}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4 py-2.5 text-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {payingId === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      Pay Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Configure Store Modal */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfig(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-50">
                  {editItem ? 'Edit Product' : 'Add Product'}
                </h3>
                <button
                  onClick={() => setShowConfig(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Product Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Premium Coffee"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-50 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Description</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Short description (optional)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-50 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Price (QIE)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.0001"
                    min="0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-50 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  {formPrice && !isNaN(parseFloat(formPrice)) && (
                    <p className="text-xs text-slate-500 mt-1">
                      ~{formatUSD(parseFloat(formPrice))}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveProduct}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
                >
                  {editItem ? 'Update' : 'Add Product'}
                </button>
                <button
                  onClick={() => setShowConfig(false)}
                  className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-4 py-2.5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
