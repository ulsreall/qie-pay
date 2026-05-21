import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Download, Printer, Copy, Check, Loader2, AlertCircle, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPayment } from '../utils/contract';
import { format } from 'date-fns';
import { formatQIEAmount, formatUSD } from '../utils/currency';
import { generateInvoiceHTML, downloadInvoice } from '../utils/invoice';
import { EXPLORER_URL } from '../utils/constants';

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
    if (!ts) return '—';
    try { return format(new Date(ts * 1000), 'MMMM d, yyyy'); } catch { return '—'; }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-emerald-500" />
          <p className="text-slate-400 text-xs mt-3">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-10 text-center">
            <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-50 mb-1">Invoice Not Found</h2>
            <p className="text-slate-400 text-sm">{error}</p>
            <Link
              to="/dashboard"
              className="inline-block mt-3 text-xs text-emerald-500 hover:text-emerald-400"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const invoiceHTML = generateInvoiceHTML(payment, payment.merchant);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="p-6 lg:p-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-50 tracking-tight">Invoice</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              QIE-{payment.id.toString().padStart(6, '0')} · {formatDate(payment.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-md px-3 py-1.5 text-xs transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              Share
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-md px-3 py-1.5 text-xs transition-colors"
            >
              <Printer size={12} /> Print
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md px-3 py-1.5 text-xs transition-colors"
            >
              <Download size={12} /> Download HTML
            </button>
          </div>
        </div>

        {/* Payment summary card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 mb-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-md flex items-center justify-center">
                <span className="text-emerald-500 font-bold text-sm">Q</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-50">QIEPay Invoice</p>
                <p className="text-xs text-slate-500">
                  QIE-{payment.id.toString().padStart(6, '0')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            <div>
              <p className="text-slate-500 uppercase tracking-wider mb-0.5">From (Merchant)</p>
              <p className="text-slate-300 font-mono break-all text-xs">{payment.merchant}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase tracking-wider mb-0.5">To (Customer)</p>
              <p className="text-slate-300 font-mono break-all text-xs">
                {payment.customer && payment.customer !== '0x0000000000000000000000000000000000000000'
                  ? payment.customer
                  : 'Pending Payment'}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-md p-3">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-xs text-slate-300">{payment.description || 'Payment'}</span>
              <span className="text-xs font-semibold text-slate-50 tabular-nums">
                {formatQIEAmount(payment.amount)} QIE
              </span>
            </div>
            {payment.orderId && (
              <p className="text-xs text-slate-500">Order: {payment.orderId}</p>
            )}
            <div className="flex justify-between items-center mt-0.5">
              <span className="text-xs text-slate-500">≈ {formatUSD(payment.amount)}</span>
            </div>
          </div>

          {payment.fee && parseFloat(payment.fee) > 0 && (
            <div className="flex justify-between items-center mt-2 text-xs">
              <span className="text-slate-400">Platform Fee (2.5%)</span>
              <span className="text-red-400 tabular-nums">-{formatQIEAmount(payment.fee)} QIE</span>
            </div>
          )}

          {payment.settledAt > 0 && (
            <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md p-2">
              <p className="text-xs font-medium text-emerald-400">✓ Settled</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Settlement completed on {formatDate(payment.settledAt)}
              </p>
            </div>
          )}
        </div>

        {/* Iframe preview */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <FileText size={12} /> Invoice Preview
            </span>
            {payment.txHash && (
              <a
                href={`${EXPLORER_URL}/tx/${payment.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
              >
                View on Explorer <ExternalLink size={10} />
              </a>
            )}
          </div>
          <iframe
            ref={iframeRef}
            srcDoc={invoiceHTML}
            title={`Invoice QIE-${payment.id.toString().padStart(6, '0')}`}
            className="w-full border-0"
            style={{ minHeight: '700px', background: '#f8fafc' }}
            sandbox="allow-same-origin"
          />
        </div>

        {/* Back link */}
        <div className="mt-4 text-center">
          <Link
            to={`/pay/${id}`}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to Payment
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
