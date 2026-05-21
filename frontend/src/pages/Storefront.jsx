import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, BadgeCheck, CreditCard, Share2, Copy,
  Plus, Edit3, Trash2, X, Loader2, ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { connectWallet, checkConnection, isMerchant, getMerchantPayments, getMerchantEarnings, createPayment, ensureMerchant } from '../utils/contract';
import { formatUSD } from '../utils/currency';

const GRADIENTS = [
  'from-[#10B981] to-[#047857]',
  'from-sky-500 to-sky-700',
  'from-amber-500 to-amber-700',
  'from-pink-500 to-pink-700',
  'from-violet-500 to-violet-700',
  'from-cyan-500 to-cyan-700',
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
          let prods = loadProducts(address);

          if (prods.length === 0) {
            prods = [
              { id: 'demo-1', name: 'Espresso', description: 'Double shot espresso, rich and bold', price: 0.05 },
              { id: 'demo-2', name: 'Cappuccino', description: 'Classic Italian cappuccino with steamed milk', price: 0.08 },
              { id: 'demo-3', name: 'Matcha Latte', description: 'Premium Japanese matcha with oat milk', price: 0.10 },
              { id: 'demo-4', name: 'Croissant', description: 'Buttery French croissant, freshly baked', price: 0.06 },
              { id: 'demo-5', name: 'Avocado Toast', description: 'Sourdough with smashed avocado & poached egg', price: 0.12 },
              { id: 'demo-6', name: 'Berry Smoothie', description: 'Mixed berry smoothie with Greek yogurt', price: 0.07 },
            ];
            saveProducts(address, prods);
          }

          setProducts(prods);

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
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#10B981] animate-spin" />
      </div>
    );
  }

  // Not a merchant
  if (!merchantExists) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col items-center justify-center px-4 text-center">
        <Store className="w-12 h-12 text-[#3F3F46] mb-3" />
        <h2 className="text-lg font-bold mb-1">Merchant Not Found</h2>
        <p className="text-[#A1A1AA] text-xs">
          The address <code className="text-[#34D399]">{truncAddr}</code> is not registered as a merchant.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA]">
      {/* Hero banner */}
      <div className="bg-[#111113] border-b border-[#27272A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] flex items-center justify-center">
                  <Store className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <h1 className="text-lg font-bold flex items-center gap-1.5 text-[#FAFAFA] tracking-tight">
                    {truncAddr}
                    <BadgeCheck className="w-4 h-4 text-[#34D399]" />
                  </h1>
                  <span className="text-[10px] bg-[rgba(16,185,129,0.1)] text-[#34D399] px-1.5 py-0.5 rounded-full">
                    Verified Merchant
                  </span>
                </div>
              </div>

              <div className="flex gap-4 mt-3">
                <div className="bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2">
                  <p className="text-[10px] text-[#71717A]">Payments</p>
                  <p className="text-sm font-bold text-[#A1A1AA] tabular-nums">{stats.payments}</p>
                </div>
                <div className="bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2">
                  <p className="text-[10px] text-[#71717A]">Earnings</p>
                  <p className="text-sm font-bold text-[#34D399] tabular-nums">{stats.earnings} QIE</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={shareUrl}
                className="inline-flex items-center gap-1.5 border border-[#3F3F46] hover:border-[#52525B] text-[#A1A1AA] rounded-md px-3 py-2 text-xs transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              {wallet ? (
                <span className="inline-flex items-center text-xs text-[#71717A] font-mono border border-[#27272A] rounded-md px-3 py-2">
                  {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
                </span>
              ) : (
                <button
                  onClick={handleConnect}
                  className="bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md px-3 py-2 text-xs transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#A1A1AA] flex items-center gap-1.5 tracking-tight">
            <ShoppingBag className="w-4 h-4 text-[#34D399]" /> Products
          </h2>
          {isOwner && (
            <button
              onClick={openAdd}
              className="bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md px-3 py-1.5 text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Configure Store
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-12 h-12 text-[#3F3F46] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#A1A1AA] mb-1">
              This merchant hasn't set up their storefront yet
            </h3>
            {isOwner && (
              <button
                onClick={openAdd}
                className="mt-3 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md px-5 py-2 text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05, duration: 0.15 }}
                className="bg-[#111113] border border-[#27272A] rounded-lg overflow-hidden group"
              >
                {/* Image placeholder */}
                <div className={`h-28 bg-gradient-to-br ${getGradient(index)} flex items-center justify-center`}>
                  <span className="text-3xl font-bold text-white/30">{product.name[0]}</span>
                </div>

                <div className="p-3">
                  <div className="flex items-start justify-between mb-0.5">
                    <h3 className="font-semibold text-sm text-[#FAFAFA]">{product.name}</h3>
                    {isOwner && (
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(product)}
                          className="w-6 h-6 rounded-md hover:bg-[#18181B] flex items-center justify-center text-[#A1A1AA] hover:text-[#D4D4D8]"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="w-6 h-6 rounded-md hover:bg-red-500/10 flex items-center justify-center text-[#A1A1AA] hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-[#A1A1AA] text-xs mb-2 line-clamp-2">{product.description}</p>
                  )}

                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="text-[#34D399] font-bold text-sm tabular-nums">{product.price.toFixed(4)} QIE</p>
                      <p className="text-[#71717A] text-[10px]">~{formatUSD(product.price)}</p>
                    </div>
                    <button
                      onClick={() => handlePay(product)}
                      disabled={payingId === product.id}
                      className="bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md px-3 py-1.5 text-xs flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {payingId === product.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5" />
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
              className="bg-[#111113] border border-[#27272A] rounded-lg p-5 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#FAFAFA] tracking-tight">
                  {editItem ? 'Edit Product' : 'Add Product'}
                </h3>
                <button
                  onClick={() => setShowConfig(false)}
                  className="w-7 h-7 rounded-md hover:bg-[#18181B] flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-[#A1A1AA]" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-[#A1A1AA] mb-1 block">Product Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Premium Coffee"
                    className="w-full bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-[#FAFAFA] text-xs focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A1A1AA] mb-1 block">Description</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Short description (optional)"
                    className="w-full bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-[#FAFAFA] text-xs focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A1A1AA] mb-1 block">Price (QIE)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.0001"
                    min="0"
                    className="w-full bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-[#FAFAFA] text-xs focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 outline-none transition-all"
                  />
                  {formPrice && !isNaN(parseFloat(formPrice)) && (
                    <p className="text-xs text-[#71717A] mt-0.5">
                      ~{formatUSD(parseFloat(formPrice))}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={saveProduct}
                  className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md px-3 py-2 text-xs transition-colors"
                >
                  {editItem ? 'Update' : 'Add Product'}
                </button>
                <button
                  onClick={() => setShowConfig(false)}
                  className="flex-1 border border-[#3F3F46] hover:border-[#52525B] text-[#A1A1AA] font-medium rounded-md px-3 py-2 text-xs transition-colors"
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
