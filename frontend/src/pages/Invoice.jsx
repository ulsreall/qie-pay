import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Download, Printer, Copy, Check, Loader2, AlertCircle, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPayment } from '../utils/contract';
import { format } from 'date-fns';
import { formatQIEAmount, formatUSD, getQIEPrice } from '../utils/currency';
import { generateInvoiceHTML, downloadInvoice } from '../utils/invoice';
import { EXPLORER_URL } from '../utils/constants';
import StatusBadge from '../components/StatusBadge';

export default function Invoice() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    loadPayment();
  }, [id]);

  const loadPayment = async () => {
    setLoading(true);
    try {
      const data = await getPayment(id);
      setPayment(data);
    } catch (err) {
      setError('Payment not found');
    }
    setLoading(false);
  };

  const handleDownload = () => {
    if (payment) {
      downloadInvoice(payment, payment.merchant);
      toast.success('Invoice downloaded');
    }
  };

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    } else {
      window.print();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (ts) => {
    if (!ts) return '-';
    try { return format(new Date(ts * 1000), 'MMMM d, yyyy'); } catch { return '-'; }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Loader2 size={32} className="animate-spin text-purple-400 mx-auto" />
        <p className="text-slate-400 mt-4">Loading invoice...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto py-20 text-center">
        <div className="glass p-12">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invoice Not Found</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </motion.div>
    );
  }

  const invoiceHTML = generateInvoiceHTML(payment, payment.merchant);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-xl font-bold text-white">Invoice</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            #{payment.id} • {formatDate(payment.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopyLink} className="btn-ghost flex items-center gap-2 text-sm">
            {copied ? <Check size={14} /> : <Copy size={14} />} Share
          </button>
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-sm">
            <Printer size={14} /> Print
          </button>
          <button onClick={handleDownload} className="btn-primary flex items-center gap-2 text-sm">
            <Download size={14} /> Download HTML
          </button>
        </div>
      </div>

      {/* Invoice summary (React-rendered for app context) */}
      <div className="glass p-6 mb-4 no-print">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">QIEPay Invoice</p>
              <p className="text-xs text-slate-500">QIE-{payment.id.toString().padStart(6, '0')}</p>
            </div>
          </div>
          <StatusBadge status={payment.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          <div>
            <p className="text-slate-500 uppercase tracking-wider mb-1">From</p>
            <p className="text-white font-mono break-all">{payment.merchant}</p>
          </div>
          <div>
            <p className="text-slate-500 uppercase tracking-wider mb-1">To</p>
            <p className="text-white font-mono break-all">
              {payment.customer && payment.customer !== '0x0000000000000000000000000000000000000000'
                ? payment.customer
                : 'Pending Payment'}
            </p>
          </div>
        </div>

        <div className="glass-light p-3 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-slate-400">{payment.description || 'Payment'}</span>
            <span className="text-sm font-semibold text-white">{formatQIEAmount(payment.amount)} QIE</span>
          </div>
          {payment.orderId && (
            <p className="text-xs text-slate-500">Order: {payment.orderId}</p>
          )}
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-slate-500">≈ {formatUSD(payment.amount)}</span>
          </div>
        </div>

        {payment.fee && parseFloat(payment.fee) > 0 && (
          <div className="flex justify-between items-center mt-2 text-xs">
            <span className="text-slate-500">Platform Fee (2.5%)</span>
            <span className="text-red-400">-{formatQIEAmount(payment.fee)} QIE</span>
          </div>
        )}

        {payment.txHash && (
          <a
            href={`${EXPLORER_URL}/tx/${payment.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mt-3"
          >
            View on Explorer <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Iframe rendering of full HTML invoice */}
      <div className="glass overflow-hidden">
        <iframe
          ref={iframeRef}
          srcDoc={invoiceHTML}
          title={`Invoice QIE-${payment.id.toString().padStart(6, '0')}`}
          className="w-full border-0"
          style={{ minHeight: '800px', background: '#f8fafc' }}
          sandbox="allow-same-origin"
        />
      </div>

      {/* Back link */}
      <div className="mt-6 text-center no-print">
        <Link to={`/pay/${id}`} className="btn-ghost text-sm">← Back to Payment</Link>
      </div>
    </motion.div>
  );
}
