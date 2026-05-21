import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function PaymentQRCode({ value, size = 160 }) {
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
      <div className="bg-white p-3 rounded-lg">
        <QRCodeSVG
          value={value}
          size={size}
          bgColor="#ffffff"
          fgColor="#10B981"
          level="H"
          includeMargin={false}
        />
      </div>
      <p className="text-sm text-[#A1A1AA] font-medium">Scan to Pay</p>
      <button
        onClick={handleCopy}
        className="btn-secondary text-sm"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-[#34D399]" />
            <span className="text-[#34D399]">Copied!</span>
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
