import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function PaymentQRCode({ value, size = 200 }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <QRCodeSVG
          value={value}
          size={size}
          bgColor="#ffffff"
          fgColor="#10B981"
          level="H"
          includeMargin={false}
        />
      </div>
      <p className="text-sm text-slate-400 font-medium">Scan to Pay</p>
      <button
        onClick={handleCopy}
        className="btn-secondary text-sm"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy URL
          </>
        )}
      </button>
    </motion.div>
  );
}
