import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Plus, Minus, Trash2, X, CreditCard, Package,
  ArrowLeft, Copy, ExternalLink, RotateCcw, Loader2, CheckCircle2, QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';
import PaymentQRCode from '../components/QRCode';
import { connectWallet, checkConnection, isMerchant, ensureMerchant, createPayment } from '../utils/contract';
import { formatUSD, getQIEPrice } from '../utils/currency';
import { EXPLORER_URL } from '../utils/constants';

const DEMO_PRODUCTS = [
  { id: 'coffee',   name: 'Coffee',    price: 0.05, color: 'from-amber-600 to-yellow-800' },
  { id: 'tea',      name: 'Tea',       price: 0.03, color: 'from-green-600 to-emerald-800' },
  { id: 'sandwich', name: 'Sandwich',  price: 0.08, color: 'from-orange-600 to-red-800' },
  { id: 'cake',     name: 'Cake',      price: 0.06, color: 'from-pink-600 to-rose-800' },
  { id: 'juice',    name: 'Juice',     price: 0.04, color: 'from-cyan-600 to-blue-800' },
  { id: 'water',    name: 'Water',     price: 0.02, color: 'from-sky-600 to-indigo-800' },
];

const PLATFORM_FEE_PERCENT = 2.5;

export default function POS() {
  const navigate = useNavigate();
  const qrRef = useRef(null);

  // Wallet state
  const [wallet, setWallet] = useState(null);
  const [merchant, setMerchant] = useState(false);

  // Cart state
  const [cart, setCart] = useState([]);

  // Custom item form
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // Payment state
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  // Check wallet on mount
  useEffect(() => {
    (async () => {
      try {
        const w = await checkConnection();
        if (w) {
          setWallet(w);
          const m = await isMerchant(w.address);
          setMerchant(m);
        }
      } catch {}
    })();
  }, []);

  // Auto-scroll to QR on success
  useEffect(() => {
    if (result && qrRef.current) {
      setTimeout(() => qrRef.current.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, [result]);

  const handleConnect = async () => {
    try {
      const w = await connectWallet();
      setWallet(w);
      const m = await isMerchant(w.address);
      setMerchant(m);
      toast.success('Wallet connected');
    } catch (err) {
      toast.error(err.message || 'Failed to connect');
    }
  };

  // Cart operations
  const addToCart = (product) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} added`, { duration: 1200 });
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      return prev
        .map(item => item.id === id ? { ...item, qty: item.qty + delta } : item)
        .filter(item => item.qty > 0);
    });
  };

  const removeFromCart = (id) => {
    const item = cart.find(i => i.id === id);
    setCart(prev => prev.filter(i => i.id !== id));
    if (item) toast(`Removed ${item.name}`, { icon: '🗑️' });
  };

  const clearCart = () => {
    setCart([]);
    toast('Cart cleared', { icon: '🧹' });
  };

  // Custom item
  const addCustomItem = () => {
    const price = parseFloat(customPrice);
    if (!customName.trim()) return toast.error('Enter item name');
    if (isNaN(price) || price <= 0) return toast.error('Enter valid price');

    const id = `custom-${Date.now()}`;
    addToCart({ id, name: customName.trim(), price, color: 'from-violet-600 to-purple-800' });
    setCustomName('');
    setCustomPrice('');
    setShowCustom(false);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const fee = subtotal * (PLATFORM_FEE_PERCENT / 100);
  const total = subtotal + fee;

  // Generate payment
  const handleGenerate = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');

    try {
      setGenerating(true);

      // Ensure merchant registration
      const m = await ensureMerchant();
      if (m.isNew) toast.success('Merchant registered!');

      const description = cart.map(i => `${i.name} x${i.qty}`).join(', ');
      const orderId = `POS-${Date.now()}`;

      const res = await createPayment(description, orderId, total);
      const paymentUrl = `${window.location.origin}/pay/${res.paymentId}`;

      setResult({
        paymentId: res.paymentId,
        url: paymentUrl,
        description,
        total,
        orderId,
      });

      toast.success('Payment created! 🎉');
    } catch (err) {
      toast.error(err.message || 'Failed to create payment');
    } finally {
      setGenerating(false);
    }
  };

  const newSale = () => {
    setCart([]);
    setResult(null);
    setShowCustom(false);
    setCustomName('');
    setCustomPrice('');
    toast('New sale started', { icon: '✨' });
  };

  const copyUrl = () => {
    if (result) {
      navigator.clipboard.writeText(result.url);
      toast.success('Link copied!');
    }
  };

  // ── Success modal ──
  if (result) {
    return (
      <div className="min-h-screen bg-[#06060e] text-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-400" />
            <span className="text-lg font-bold gradient-text">QIEPay POS</span>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Exit POS
          </Link>
        </div>

        <div ref={qrRef} className="flex flex-col items-center justify-center px-4 py-12 max-w-lg mx-auto gap-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <CheckCircle2 className="w-20 h-20 text-emerald-400" />
          </motion.div>

          <h2 className="text-2xl font-bold text-center">Payment Created!</h2>
          <p className="text-white/60 text-center text-sm">{result.description}</p>

          <div className="glass rounded-2xl p-6 w-full flex flex-col items-center gap-4">
            <p className="text-sm text-white/40">Scan QR to pay</p>
            <PaymentQRCode value={result.url} size={220} />
            <p className="text-2xl font-bold text-purple-400">
              {result.total.toFixed(4)} QIE
            </p>
            <p className="text-sm text-white/40">
              (~{formatUSD(result.total)})
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button onClick={copyUrl} className="btn-secondary flex items-center justify-center gap-2 flex-1 py-3">
              <Copy className="w-4 h-4" /> Copy Link
            </button>
            <a
              href={`${EXPLORER_URL}/tx/${result.paymentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center justify-center gap-2 flex-1 py-3"
            >
              <ExternalLink className="w-4 h-4" /> Explorer
            </a>
          </div>

          <button
            onClick={newSale}
            className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" /> New Sale
          </button>
        </div>
      </div>
    );
  }

  // ── Main POS view ──
  return (
    <div className="min-h-screen bg-[#06060e] text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/30 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-purple-400" />
          <span className="text-lg font-bold gradient-text">QIEPay POS</span>
        </div>
        <div className="flex items-center gap-3">
          {wallet ? (
            <span className="text-xs text-white/50 hidden sm:inline">
              {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
            </span>
          ) : (
            <button onClick={handleConnect} className="btn-primary text-sm py-2 px-4">
              Connect Wallet
            </button>
          )}
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit POS</span>
          </Link>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT — Product grid */}
        <div className="lg:w-[60%] p-4 sm:p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" /> Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {DEMO_PRODUCTS.map((product) => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => addToCart(product)}
                className="glass rounded-2xl p-4 flex flex-col items-center gap-3 cursor-pointer
                           hover:border-purple-500/40 transition-colors text-left min-h-[140px]"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center text-2xl font-bold text-white/90 shadow-lg`}>
                  {product.name[0]}
                </div>
                <span className="font-semibold text-sm text-center">{product.name}</span>
                <div className="text-center">
                  <span className="text-purple-400 font-bold text-sm">{product.price.toFixed(2)} QIE</span>
                  <span className="text-white/40 text-xs block">~{formatUSD(product.price)}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* RIGHT — Cart panel */}
        <div className="lg:w-[40%] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-black/20">
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-400" />
                Cart
                {cart.length > 0 && (
                  <span className="ml-1 bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                    {cart.reduce((s, i) => s + i.qty, 0)}
                  </span>
                )}
              </h2>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center text-white/30 py-12">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Tap products to add to cart</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      className="glass rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                        {item.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-purple-400 text-xs">{item.price.toFixed(2)} QIE ea</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold w-16 text-right">
                        {(item.price * item.qty).toFixed(4)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Add custom item */}
            {showCustom ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="glass rounded-xl p-4 mb-4"
              >
                <p className="text-sm font-medium mb-3">Custom Item</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="input-field text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Price (QIE)"
                    value={customPrice}
                    onChange={e => setCustomPrice(e.target.value)}
                    step="0.01"
                    min="0"
                    className="input-field text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={addCustomItem} className="btn-primary flex-1 py-2 text-sm">
                      Add
                    </button>
                    <button onClick={() => setShowCustom(false)} className="btn-secondary flex-1 py-2 text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowCustom(true)}
                className="w-full mb-4 py-3 rounded-xl border border-dashed border-white/20 text-white/50
                           hover:border-purple-500/40 hover:text-purple-300 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Custom Item
              </button>
            )}
          </div>

          {/* Totals & Generate */}
          {cart.length > 0 && (
            <div className="border-t border-white/10 p-4 sm:p-6 space-y-2 bg-black/30">
              <div className="flex justify-between text-sm text-white/60">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(4)} QIE</span>
              </div>
              <div className="flex justify-between text-sm text-white/60">
                <span>Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                <span>{fee.toFixed(4)} QIE</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2">
                <span>Total</span>
                <div className="text-right">
                  <span className="text-purple-400">{total.toFixed(4)} QIE</span>
                  <span className="text-white/40 text-xs block">~{formatUSD(total)}</span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !wallet}
                className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2 mt-3
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Generating…
                  </>
                ) : !wallet ? (
                  'Connect Wallet First'
                ) : (
                  <>
                    <QrCode className="w-5 h-5" /> Generate Payment
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
