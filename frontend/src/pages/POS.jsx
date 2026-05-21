import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Plus, Minus, Trash2, X, CreditCard, Package,
  ArrowLeft, Copy, ExternalLink, RotateCcw, Loader2, CheckCircle2, QrCode, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { connectWallet, checkConnection, isMerchant, ensureMerchant, createPayment } from '../utils/contract';
import { formatUSD, getQIEPrice } from '../utils/currency';
import { EXPLORER_URL } from '../utils/constants';

const DEMO_PRODUCTS = [
  { id: 'coffee',   name: 'Coffee',    price: 0.05, color: 'from-amber-500 to-amber-700' },
  { id: 'tea',      name: 'Tea',       price: 0.03, color: 'from-emerald-500 to-emerald-700' },
  { id: 'sandwich', name: 'Sandwich',  price: 0.08, color: 'from-orange-500 to-orange-700' },
  { id: 'cake',     name: 'Cake',      price: 0.06, color: 'from-pink-500 to-pink-700' },
  { id: 'juice',    name: 'Juice',     price: 0.04, color: 'from-sky-500 to-sky-700' },
  { id: 'water',    name: 'Water',     price: 0.02, color: 'from-blue-500 to-blue-700' },
];

const PLATFORM_FEE_PERCENT = 2.5;

export default function POS() {
  const navigate = useNavigate();
  const qrRef = useRef(null);

  const [wallet, setWallet] = useState(null);
  const [merchant, setMerchant] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

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

  const addCustomItem = () => {
    const price = parseFloat(customPrice);
    if (!customName.trim()) return toast.error('Enter item name');
    if (isNaN(price) || price <= 0) return toast.error('Enter valid price');

    const id = `custom-${Date.now()}`;
    addToCart({ id, name: customName.trim(), price, color: 'from-violet-500 to-violet-700' });
    setCustomName('');
    setCustomPrice('');
    setShowCustom(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const fee = subtotal * (PLATFORM_FEE_PERCENT / 100);
  const total = subtotal + fee;

  const handleGenerate = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');

    try {
      setGenerating(true);
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

      toast.success('Payment created!');
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
      <div className="min-h-screen bg-slate-900 text-slate-50">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-50">QIEPay POS</span>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Exit POS
          </Link>
        </div>

        <div ref={qrRef} className="flex flex-col items-center justify-center px-4 py-12 max-w-lg mx-auto gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <CheckCircle2 className="w-20 h-20 text-emerald-400" />
          </motion.div>

          <h2 className="text-2xl font-bold text-center">Payment Created!</h2>
          <p className="text-slate-400 text-center text-sm">{result.description}</p>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full flex flex-col items-center gap-4">
            <p className="text-sm text-slate-400">Scan QR to pay</p>
            <div className="bg-white p-3 rounded-xl">
              <QRCodeSVG value={result.url} size={200} />
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {result.total.toFixed(4)} QIE
            </p>
            <p className="text-sm text-slate-400">
              (~{formatUSD(result.total)})
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={copyUrl}
              className="flex-1 inline-flex items-center justify-center gap-2 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-4 py-3 transition-colors"
            >
              <Copy className="w-4 h-4" /> Copy Link
            </button>
            <a
              href={`${EXPLORER_URL}/tx/${result.paymentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-4 py-3 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Explorer
            </a>
          </div>

          <button
            onClick={newSale}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4 py-4 text-lg flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5" /> New Sale
          </button>
        </div>
      </div>
    );
  }

  // ── Main POS view ──
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-700 bg-slate-900 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-50">QIEPay POS</span>
        </div>
        <div className="flex items-center gap-3">
          {wallet ? (
            <span className="text-xs text-slate-500 hidden sm:inline font-mono">
              {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
            </span>
          ) : (
            <button
              onClick={handleConnect}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            >
              Connect Wallet
            </button>
          )}
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors text-sm"
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
            <Package className="w-5 h-5 text-emerald-500" /> Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {DEMO_PRODUCTS.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer
                           hover:border-emerald-500/40 transition-colors text-left min-h-[140px]"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center text-2xl font-bold text-white/90`}>
                  {product.name[0]}
                </div>
                <span className="font-semibold text-sm text-center text-slate-50">{product.name}</span>
                <div className="text-center">
                  <span className="text-emerald-400 font-bold text-sm">{product.price.toFixed(2)} QIE</span>
                  <span className="text-slate-500 text-xs block">~{formatUSD(product.price)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — Cart panel */}
        <div className="lg:w-[40%] border-t lg:border-t-0 lg:border-l border-slate-700 flex flex-col bg-slate-800/50">
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-500" />
                Cart
                {cart.length > 0 && (
                  <span className="ml-1 bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-medium">
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
              <div className="text-center text-slate-500 py-12">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Tap products to add to cart</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-sm font-bold flex-shrink-0 text-white`}>
                        {item.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-slate-50">{item.name}</p>
                        <p className="text-emerald-400 text-xs">{item.price.toFixed(2)} QIE ea</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold w-16 text-right text-slate-50">
                        {(item.price * item.qty).toFixed(4)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-red-400 transition-colors"
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
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-slate-50 mb-3">Custom Item</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-50 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Price (QIE)"
                    value={customPrice}
                    onChange={e => setCustomPrice(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-50 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addCustomItem}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowCustom(false)}
                      className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-4 py-2 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCustom(true)}
                className="w-full mb-4 py-3 rounded-xl border border-dashed border-slate-600 text-slate-400
                           hover:border-emerald-500/40 hover:text-emerald-400 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Custom Item
              </button>
            )}
          </div>

          {/* Totals & Generate */}
          {cart.length > 0 && (
            <div className="border-t border-slate-700 p-4 sm:p-6 space-y-2 bg-slate-900">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(4)} QIE</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                <span>{fee.toFixed(4)} QIE</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-slate-700 pt-2">
                <span className="text-slate-50">Total</span>
                <div className="text-right">
                  <span className="text-emerald-400">{total.toFixed(4)} QIE</span>
                  <span className="text-slate-500 text-xs block">~{formatUSD(total)}</span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !wallet}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4 py-4 text-lg flex items-center justify-center gap-2 mt-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
