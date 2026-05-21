import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Plus, Minus, Trash2, X, CreditCard, Package,
  ArrowLeft, Copy, ExternalLink, RotateCcw, Loader2, CheckCircle2,
  QrCode, Coffee, Sandwich, Cake, GlassWater, IceCreamCone, Cookie
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { connectWallet, checkConnection, isMerchant, ensureMerchant, createPayment } from '../utils/contract';
import { formatUSD, getQIEPrice } from '../utils/currency';
import { EXPLORER_URL } from '../utils/constants';

/* ─── Product Catalog with real emojis ─── */
const CATEGORIES = [
  {
    id: 'drinks',
    label: '☕ Drinks',
    items: [
      { id: 'coffee',   name: 'Coffee',       price: 0.05, emoji: '☕', bg: '#78350F' },
      { id: 'tea',      name: 'Green Tea',    price: 0.03, emoji: '🍵', bg: '#14532D' },
      { id: 'juice',    name: 'Orange Juice', price: 0.04, emoji: '🍊', bg: '#7C2D12' },
      { id: 'water',    name: 'Water',        price: 0.02, emoji: '💧', bg: '#1E3A5F' },
      { id: 'smoothie', name: 'Smoothie',     price: 0.06, emoji: '🥤', bg: '#581C87' },
      { id: 'matcha',   name: 'Matcha Latte', price: 0.07, emoji: '🍃', bg: '#1A2E05' },
    ],
  },
  {
    id: 'food',
    label: '🍕 Food',
    items: [
      { id: 'sandwich', name: 'Sandwich',     price: 0.08, emoji: '🥪', bg: '#713F12' },
      { id: 'cake',     name: 'Chocolate Cake', price: 0.06, emoji: '🍫', bg: '#451A03' },
      { id: 'cookie',   name: 'Cookie',       price: 0.02, emoji: '🍪', bg: '#78350F' },
      { id: 'croissant',name: 'Croissant',    price: 0.05, emoji: '🥐', bg: '#713F12' },
      { id: 'donut',    name: 'Donut',        price: 0.04, emoji: '🍩', bg: '#831843' },
      { id: 'pizza',    name: 'Pizza Slice',  price: 0.07, emoji: '🍕', bg: '#7C2D12' },
    ],
  },
  {
    id: 'quick',
    label: '⚡ Quick Amount',
    items: [
      { id: 'q1', name: '0.01 QIE', price: 0.01, emoji: '🪙', bg: '#1E3A5F' },
      { id: 'q2', name: '0.10 QIE', price: 0.10, emoji: '🪙', bg: '#1E3A5F' },
      { id: 'q3', name: '0.50 QIE', price: 0.50, emoji: '💰', bg: '#14532D' },
      { id: 'q4', name: '1.00 QIE', price: 1.00, emoji: '💰', bg: '#14532D' },
      { id: 'q5', name: '5.00 QIE', price: 5.00, emoji: '💎', bg: '#312E81' },
      { id: 'q6', name: '10.00 QIE', price: 10.00, emoji: '💎', bg: '#312E81' },
    ],
  },
];

const PLATFORM_FEE_PERCENT = 2.5;

export default function POS() {
  const qrRef = useRef(null);

  const [wallet, setWallet] = useState(null);
  const [merchant, setMerchant] = useState(false);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('drinks');
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
    toast.success(`${product.name} added`, { duration: 1000, icon: product.emoji });
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
    addToCart({ id, name: customName.trim(), price, emoji: '🏷️', bg: '#3F3F46' });
    setCustomName('');
    setCustomPrice('');
    setShowCustom(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const fee = subtotal * (PLATFORM_FEE_PERCENT / 100);
  const total = subtotal + fee;
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

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
        items: [...cart],
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
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272A]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#10B981] rounded-md flex items-center justify-center">
              <span className="text-sm">💳</span>
            </div>
            <span className="text-sm font-bold text-[#FAFAFA]">QIEPay POS</span>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-[#D4D4D8] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Exit POS
          </Link>
        </div>

        <div ref={qrRef} className="flex flex-col items-center justify-center px-4 py-8 max-w-sm mx-auto gap-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <CheckCircle2 className="w-14 h-14 text-[#34D399]" />
          </motion.div>

          <div className="text-center">
            <h2 className="text-lg font-bold">Payment Created!</h2>
            <p className="text-[#A1A1AA] text-xs mt-1">{result.description}</p>
          </div>

          {/* Order summary */}
          <div className="bg-[#111113] border border-[#27272A] rounded-lg p-4 w-full space-y-2">
            {result.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-[#A1A1AA]">
                  {item.emoji} {item.name} × {item.qty}
                </span>
                <span className="text-[#D4D4D8] tabular-nums">{(item.price * item.qty).toFixed(4)} QIE</span>
              </div>
            ))}
            <div className="border-t border-[#27272A] pt-2 flex justify-between text-sm font-bold">
              <span className="text-[#A1A1AA]">Total</span>
              <span className="text-[#34D399] tabular-nums">{result.total.toFixed(4)} QIE</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 w-full flex flex-col items-center gap-3">
            <p className="text-xs text-[#A1A1AA]">Scan QR to pay</p>
            <div className="bg-white p-2.5 rounded-lg">
              <QRCodeSVG value={result.url} size={160} />
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <button
              onClick={copyUrl}
              className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[#3F3F46] hover:border-[#52525B] text-[#A1A1AA] rounded-md px-3 py-2.5 text-xs transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Link
            </button>
            <a
              href={`${EXPLORER_URL}/tx/${result.paymentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[#3F3F46] hover:border-[#52525B] text-[#A1A1AA] rounded-md px-3 py-2.5 text-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Explorer
            </a>
          </div>

          <button
            onClick={newSale}
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md px-4 py-3 text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> New Sale
          </button>
        </div>
      </div>
    );
  }

  // ── Main POS view ──
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272A] bg-[#09090B] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#10B981] rounded-md flex items-center justify-center">
            <span className="text-sm">💳</span>
          </div>
          <span className="text-sm font-bold text-[#FAFAFA]">QIEPay POS</span>
        </div>
        <div className="flex items-center gap-3">
          {wallet ? (
            <span className="text-xs text-[#71717A] hidden sm:inline font-mono">
              {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
            </span>
          ) : (
            <button
              onClick={handleConnect}
              className="bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md px-3 py-1.5 text-xs transition-colors"
            >
              Connect Wallet
            </button>
          )}
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-[#A1A1AA] hover:text-[#D4D4D8] transition-colors text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit POS</span>
          </Link>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT — Products */}
        <div className="lg:w-[60%] p-4 overflow-y-auto">
          {/* Category tabs */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#111113] border border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                }`}
              >
                {cat.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(true)}
              className="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap bg-[#111113] border border-dashed border-[#3F3F46] text-[#A1A1AA] hover:border-[#10B981]/40 hover:text-[#34D399] transition-colors"
            >
              🏷️ Custom
            </button>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.find(c => c.id === activeCategory)?.items.map((product) => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => addToCart(product)}
                className="bg-[#111113] border border-[#27272A] rounded-xl p-4 flex flex-col items-center gap-2.5 cursor-pointer
                           hover:border-[#10B981]/40 hover:bg-[#10B981]/5 transition-all text-center group"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: product.bg + '40' }}
                >
                  {product.emoji}
                </div>
                <div>
                  <p className="font-medium text-sm text-[#D4D4D8]">{product.name}</p>
                  <p className="text-[#34D399] font-bold text-sm mt-0.5">{product.price.toFixed(2)} QIE</p>
                  <p className="text-[#52525B] text-[10px]">~{formatUSD(product.price)}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* RIGHT — Cart panel */}
        <div className="lg:w-[40%] border-t lg:border-t-0 lg:border-l border-[#27272A] flex flex-col bg-[#111113]/30">
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#A1A1AA] flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#34D399]" />
                Cart
                {cart.length > 0 && (
                  <span className="ml-1 bg-[rgba(16,185,129,0.1)] text-[#34D399] text-xs px-2 py-0.5 rounded-full font-mono">
                    {totalItems}
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
              <div className="text-center text-[#71717A] py-16">
                <div className="text-4xl mb-3 opacity-30">🛒</div>
                <p className="text-sm">Tap products to add to cart</p>
                <p className="text-[10px] text-[#52525B] mt-1">or use Quick Amount for custom price</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 mb-3">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="bg-[#111113] border border-[#27272A] rounded-lg p-3 flex items-center gap-3"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: (item.bg || '#3F3F46') + '40' }}
                      >
                        {item.emoji || '🏷️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate text-[#D4D4D8]">{item.name}</p>
                        <p className="text-[#34D399] text-[10px]">{item.price.toFixed(4)} QIE ea</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 rounded-md bg-[#18181B] hover:bg-[#27272A] flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold tabular-nums">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-md bg-[#18181B] hover:bg-[#27272A] flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs font-bold w-16 text-right text-[#FAFAFA] tabular-nums">
                        {(item.price * item.qty).toFixed(4)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 rounded-md hover:bg-red-500/10 flex items-center justify-center text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Add custom item */}
            {showCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#111113] border border-[#27272A] rounded-lg p-3 mb-3"
              >
                <p className="text-xs font-medium text-[#A1A1AA] mb-2">🏷️ Custom Item</p>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-[#FAFAFA] text-xs focus:border-[#10B981] outline-none transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Price (QIE)"
                    value={customPrice}
                    onChange={e => setCustomPrice(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-[#FAFAFA] text-xs focus:border-[#10B981] outline-none transition-all"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={addCustomItem}
                      className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md px-3 py-2 text-xs transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowCustom(false)}
                      className="flex-1 border border-[#3F3F46] hover:border-[#52525B] text-[#A1A1AA] font-medium rounded-md px-3 py-2 text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Totals & Generate */}
          {cart.length > 0 && (
            <div className="border-t border-[#27272A] p-4 space-y-2 bg-[#09090B]">
              <div className="flex justify-between text-xs text-[#A1A1AA]">
                <span>Subtotal ({totalItems} items)</span>
                <span className="tabular-nums">{subtotal.toFixed(4)} QIE</span>
              </div>
              <div className="flex justify-between text-xs text-[#71717A]">
                <span>Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                <span className="tabular-nums">{fee.toFixed(4)} QIE</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-[#27272A] pt-2">
                <span className="text-[#A1A1AA]">Total</span>
                <div className="text-right">
                  <span className="text-[#34D399] tabular-nums text-lg">{total.toFixed(4)} QIE</span>
                  <span className="text-[#71717A] text-[10px] block">~{formatUSD(total)}</span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !wallet}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-lg px-4 py-3.5 text-sm flex items-center justify-center gap-2 mt-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                  </>
                ) : !wallet ? (
                  'Connect Wallet First'
                ) : (
                  <>
                    <QrCode className="w-4 h-4" /> Generate Payment
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
