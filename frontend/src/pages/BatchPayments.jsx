import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Layers, Plus, Trash2, Loader2, CheckCircle, XCircle, Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { connectWallet, createPayment, checkConnection, isMerchant } from '../utils/contract';
import { formatUSD } from '../utils/currency';

export default function BatchPayments() {
  const [wallet, setWallet] = useState(null);
  const [merchantRegistered, setMerchantRegistered] = useState(false);
  const [items, setItems] = useState([{ description: '', amount: '', orderId: '' }]);
  const [creating, setCreating] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    checkConnection().then((connected) => {
      if (connected) {
        setWallet(connected);
        isMerchant(connected.address).then(setMerchantRegistered).catch(() => {});
      }
    });
  }, []);

  const addItem = () => setItems([...items, { description: '', amount: '', orderId: '' }]);

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleCreateAll = async () => {
    const valid = items.filter((item) => item.description.trim() && item.amount && parseFloat(item.amount) > 0);
    if (valid.length === 0) {
      toast.error('Add at least one valid payment');
      return;
    }

    if (!wallet) {
      try {
        const result = await connectWallet();
        setWallet({ address: result.address });
      } catch {
        toast.error('Please connect your wallet');
        return;
      }
    }

    if (!merchantRegistered) {
      toast.error('Please register as a merchant first');
      return;
    }

    setCreating(true);
    setResults([]);
    setProgress({ current: 0, total: valid.length });

    const res = [];
    for (let i = 0; i < valid.length; i++) {
      setProgress({ current: i + 1, total: valid.length });
      try {
        const toastId = toast.loading(`Creating payment ${i + 1}/${valid.length}...`);
        const { paymentId } = await createPayment(
          valid[i].description,
          valid[i].orderId || `BATCH-${Date.now()}-${i}`,
          valid[i].amount
        );
        toast.dismiss(toastId);
        res.push({ success: true, paymentId, description: valid[i].description, amount: valid[i].amount });
        toast.success(`Payment #${paymentId} created!`);
      } catch (err) {
        res.push({ success: false, description: valid[i].description, error: err.reason || err.message });
        toast.error(`Failed: ${valid[i].description}`);
      }
    }

    setResults(res);
    setCreating(false);
    toast.success(`Batch complete: ${res.filter((r) => r.success).length}/${res.length} succeeded`);
  };

  const copyAllLinks = () => {
    if (!results) return;
    const links = results.filter((r) => r.success).map((r) => `${window.location.origin}/pay/${r.paymentId}`).join('\n');
    navigator.clipboard.writeText(links);
    toast.success('All links copied!');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50">Batch Payments</h1>
        <p className="text-slate-400 text-sm mt-1">Create multiple payment requests at once</p>
      </div>

      {!results ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          {/* Items */}
          <div className="space-y-4 mb-6">
            {items.map((item, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-300">Payment #{i + 1}</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Description *"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Amount (QIE) *"
                    step="0.001"
                    min="0.001"
                    value={item.amount}
                    onChange={(e) => updateItem(i, 'amount', e.target.value)}
                    className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Order ID (optional)"
                    value={item.orderId}
                    onChange={(e) => updateItem(i, 'orderId', e.target.value)}
                    className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                {item.amount && (
                  <p className="text-xs text-slate-500 mt-2">≈ {formatUSD(item.amount)}</p>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={addItem}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-600 hover:border-slate-500 text-slate-200 rounded-lg text-sm transition-colors"
            >
              <Plus size={16} /> Add Payment
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCreateAll}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {creating ? (
                <><Loader2 size={16} className="animate-spin" /> Creating {progress.current}/{progress.total}...</>
              ) : (
                <><Layers size={16} /> Create All ({items.filter((i) => i.description.trim() && i.amount).length})</>
              )}
            </button>
          </div>

          {/* Progress bar */}
          {creating && (
            <div className="mt-4">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results */
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-50">Batch Results</h2>
            <button
              onClick={copyAllLinks}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-600 hover:border-slate-500 text-slate-200 rounded-lg text-sm transition-colors"
            >
              <Copy size={14} /> Copy All Links
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  r.success
                    ? 'bg-emerald-500/5 border border-emerald-500/20'
                    : 'bg-red-500/5 border border-red-500/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {r.success ? <CheckCircle size={18} className="text-emerald-400" /> : <XCircle size={18} className="text-red-400" />}
                  <div>
                    <p className="text-sm text-slate-50">{r.description}</p>
                    {r.success ? (
                      <p className="text-xs text-slate-500">ID: #{r.paymentId} · {r.amount} QIE</p>
                    ) : (
                      <p className="text-xs text-red-400">{r.error}</p>
                    )}
                  </div>
                </div>
                {r.success && (
                  <a href={`/pay/${r.paymentId}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 text-xs">
                    View →
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setResults(null); setItems([{ description: '', amount: '', orderId: '' }]); }}
              className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Create Another Batch
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
