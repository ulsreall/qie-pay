import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Copy, Check, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import {
  connectWallet, payForPayment, createPayment, checkConnection, isMerchant,
} from '../utils/contract';
import { formatUSD, QIE_USD_PRICE } from '../utils/currency';
import { CONTRACT_ADDRESS, EXPLORER_URL } from '../utils/constants';

export default function Widget() {
  const { address: merchantAddress } = useParams();
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkConnection().then((connected) => {
      if (connected) setWallet(connected);
    });
  }, []);

  const handlePay = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (!wallet) {
      try {
        const result = await connectWallet();
        setWallet({ address: result.address });
      } catch {
        toast.error('Connect your wallet to pay');
        return;
      }
    }

    setPaying(true);
    setResult(null);

    try {
      const toastId = toast.loading('Creating payment...');
      const { paymentId, receipt } = await createPayment(
        description || 'Widget Payment',
        `WIDGET-${Date.now()}`,
        amount
      );
      toast.dismiss(toastId);

      if (!paymentId) {
        throw new Error('Failed to create payment');
      }

      const payToastId = toast.loading('Processing payment...');
      const payReceipt = await payForPayment(paymentId, amount);
      toast.dismiss(payToastId);

      setResult({
        success: true,
        paymentId,
        txHash: payReceipt?.hash || receipt?.hash,
        amount,
      });

      toast.success(`Payment of ${amount} QIE successful!`);
      setAmount('');
      setDescription('');
    } catch (err) {
      console.error('Widget payment error:', err);
      setResult({
        success: false,
        error: err.reason || err.message || 'Payment failed',
      });
      toast.error(err.reason || err.message || 'Payment failed');
    }

    setPaying(false);
  };

  const embedCode = `<iframe src="${window.location.origin}/widget/${merchantAddress}" width="400" height="500" frameborder="0" style="border-radius: 16px; overflow: hidden;"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Embed code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!merchantAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center max-w-sm">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-50 mb-2">Invalid Widget</h2>
          <p className="text-slate-400 text-sm">No merchant address specified.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        {/* Widget Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
            <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-50">QIEPay</h2>
              <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                {merchantAddress}
              </p>
            </div>
          </div>

          {!result ? (
            <form onSubmit={handlePay} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                  Amount (QIE)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-50 text-lg font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                  required
                />
                {amount && parseFloat(amount) > 0 && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    ≈ {formatUSD(amount)} · Rate: ${QIE_USD_PRICE}/QIE
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Payment for..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-50 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>

              {/* Pay Button */}
              <button
                type="submit"
                disabled={paying || !amount}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Pay {amount ? `${amount} QIE` : ''}
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Result */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              {result.success ? (
                <>
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-50 mb-1">Payment Successful</h3>
                  <p className="text-sm text-slate-400 mb-4">{result.amount} QIE</p>
                  {result.txHash && (
                    <a
                      href={`${EXPLORER_URL}/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-400 hover:text-sky-300 flex items-center justify-center gap-1 mb-4"
                    >
                      View Transaction <ExternalLink size={12} />
                    </a>
                  )}
                  <button
                    onClick={() => setResult(null)}
                    className="w-full border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                  >
                    Make Another Payment
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} className="text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-50 mb-1">Payment Failed</h3>
                  <p className="text-sm text-red-400 mb-4">{result.error}</p>
                  <button
                    onClick={() => setResult(null)}
                    className="w-full border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-700 text-center">
            <p className="text-[10px] text-slate-600">
              Powered by QIEPay · QIE Testnet
            </p>
          </div>
        </div>

        {/* Embed Code Section (only shown in non-iframe context) */}
        {window.self === window.top && (
          <div className="mt-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-2 font-medium">Embed this widget</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[10px] text-slate-500 bg-slate-900 rounded-lg p-2 overflow-hidden text-ellipsis whitespace-nowrap font-mono">
                {embedCode}
              </code>
              <button
                onClick={handleCopyEmbed}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors flex-shrink-0"
                title="Copy embed code"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy size={14} className="text-slate-300" />
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
