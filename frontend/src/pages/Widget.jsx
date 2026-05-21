import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Copy, Check, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  connectWallet, payForPayment, createPayment, checkConnection,
} from '../utils/contract';
import { formatUSD, QIE_USD_PRICE } from '../utils/currency';
import { EXPLORER_URL } from '../utils/constants';

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

  const embedCode = `<iframe src="${window.location.origin}/widget/${merchantAddress}" width="400" height="500" frameborder="0" style="border-radius: 12px; overflow: hidden;"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Embed code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!merchantAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B] p-4">
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-6 text-center max-w-xs">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
          <h2 className="text-base font-bold text-[#FAFAFA] mb-1">Invalid Widget</h2>
          <p className="text-[#A1A1AA] text-xs">No merchant address specified.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090B] p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-xs"
      >
        {/* Widget Card */}
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-4">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#27272A]">
            <div className="w-7 h-7 bg-[#10B981] rounded-md flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#FAFAFA]">QIEPay</h2>
              <p className="text-[10px] text-[#71717A] font-mono truncate max-w-[180px]">
                {merchantAddress}
              </p>
            </div>
          </div>

          {!result ? (
            <form onSubmit={handlePay} className="space-y-3">
              {/* Amount */}
              <div>
                <label className="block text-xs text-[#A1A1AA] uppercase tracking-wider mb-1">
                  Amount (QIE)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-[#FAFAFA] text-base font-semibold focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 outline-none transition-all"
                  required
                />
                {amount && parseFloat(amount) > 0 && (
                  <p className="text-xs text-[#71717A] mt-1">
                    ≈ {formatUSD(amount)} · Rate: ${QIE_USD_PRICE}/QIE
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-[#A1A1AA] uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Payment for..."
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-[#FAFAFA] text-xs focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 outline-none transition-all"
                />
              </div>

              {/* Pay Button */}
              <button
                type="submit"
                disabled={paying || !amount}
                className="w-full h-10 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paying ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
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
              className="text-center py-3"
            >
              {result.success ? (
                <>
                  <Check size={28} className="text-[#34D399] mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-[#FAFAFA] mb-0.5">Payment Successful</h3>
                  <p className="text-xs text-[#A1A1AA] mb-3">{result.amount} QIE</p>
                  {result.txHash && (
                    <a
                      href={`${EXPLORER_URL}/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#10B981] hover:text-[#34D399] flex items-center justify-center gap-1 mb-3"
                    >
                      View Transaction <ExternalLink size={11} />
                    </a>
                  )}
                  <button
                    onClick={() => setResult(null)}
                    className="w-full border border-[#3F3F46] hover:border-[#52525B] text-[#A1A1AA] rounded-md px-3 py-2 text-xs transition-colors"
                  >
                    Make Another Payment
                  </button>
                </>
              ) : (
                <>
                  <AlertCircle size={28} className="text-red-400 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-[#FAFAFA] mb-0.5">Payment Failed</h3>
                  <p className="text-xs text-red-400 mb-3">{result.error}</p>
                  <button
                    onClick={() => setResult(null)}
                    className="w-full border border-[#3F3F46] hover:border-[#52525B] text-[#A1A1AA] rounded-md px-3 py-2 text-xs transition-colors"
                  >
                    Try Again
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-[#27272A] text-center">
            <p className="text-[10px] text-[#52525B]">
              Powered by QIEPay · QIE Testnet
            </p>
          </div>
        </div>

        {/* Embed Code Section */}
        {window.self === window.top && (
          <div className="mt-3 bg-[#111113] border border-[#27272A] rounded-lg p-3">
            <p className="text-xs text-[#A1A1AA] mb-1.5 font-medium">Embed this widget</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[10px] text-[#71717A] bg-[#09090B] rounded-md p-2 overflow-hidden text-ellipsis whitespace-nowrap font-mono">
                {embedCode}
              </code>
              <button
                onClick={handleCopyEmbed}
                className="p-1.5 rounded-md bg-[#18181B] hover:bg-[#27272A] transition-colors flex-shrink-0"
                title="Copy embed code"
              >
                {copied ? (
                  <Check size={12} className="text-[#34D399]" />
                ) : (
                  <Copy size={12} className="text-[#A1A1AA]" />
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
