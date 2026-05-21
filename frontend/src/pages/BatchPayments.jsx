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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-50 tracking-tight">Batch Payments</h1>
        <p className="text-xs text-slate-500 mt-0.5">Create multiple payment requests at once</p>
      </div>

      {!results ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          {/* Items */}
          <div className="space-y-3 mb-4">
            {items.map((item, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-700 rounded-md p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Payment #{i + 1}</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="p-0.5 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Description *"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-50 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Amount (QIE) *"
                    step="0.001"
                    min="0.001"
                    value={item.amount}
                    onChange={(e) => updateItem(i, 'amount', e.target.value)}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-50 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Order ID (optional)"
                    value={item.orderId}
                    onChange={(e) => updateItem(i, 'orderId', e.target.value)}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-slate-50 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                {item.amount && (
                  <p className="text-xs text-slate-500 mt-1">≈ {formatUSD(item.amount)}</p>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-md text-xs transition-colors"
            >
              <Plus size={14} /> Add Payment
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCreateAll}
              disabled={creating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md text-xs transition-colors disabled:opacity-60"
            >
              {creating ? (
                <><Loader2 size={14} className="animate-spin" /> {progress.current}/{progress.total}...</>
              ) : (
                <><Layers size={14} /> Create All ({items.filter((i) => i.description.trim() && i.amount).length})</>
              )}
            </button>
          </div>

          {/* Progress bar (thin) */}
          {creating && (
            <div className="mt-3">
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results */
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">Batch Results</h2>
            <button
              onClick={copyAllLinks}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-md text-xs transition-colors"
            >
              <Copy size={12} /> Copy All Links
            </button>
          </div>

          <table className="w-full text-sm mb-4">
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className={`h-10 ${i % 2 === 0 ? '' : 'bg-slate-800/50'}`}>
                  <td className="w-5">
                    {r.success ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                  </td>
                  <td className="pl-2">
                    <p className="text-sm text-slate-200">{r.description}</p>
                    {r.success ? (
                      <p className="text-xs text-slate-500">#{r.paymentId} · {r.amount} QIE</p>
                    ) : (
                      <p className="text-xs text-red-400">{r.error}</p>
                    )}
                  </td>
                  {r.success && (
                    <td className="text-right">
                      <a href={`/pay/${r.paymentId}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 text-xs">
                        View →
                      </a>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={() => { setResults(null); setItems([{ description: '', amount: '', orderId: '' }]); }}
            className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md text-sm transition-colors"
          >
            Create Another Batch
          </button>
        </div>
      )}
    </motion.div>
  );
}
