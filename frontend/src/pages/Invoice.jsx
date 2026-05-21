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
    if (!ts) return '—';
    try { return format(new Date(ts * 1000), 'MMMM d, yyyy'); } catch { return '—'; }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
          <p className="text-slate-400 mt-4">Loading invoice...</p>
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
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-50 mb-2">Invoice Not Found</h2>
            <p className="text-slate-400">{error}</p>
            <Link
              to="/dashboard"
              className="inline-block mt-4 text-sm text-sky-400 hover:text-sky-300"
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-50">Invoice</h1>
              <p className="text-sm text-slate-400 mt-1">
                QIE-{payment.id.toString().padStart(6, '0')} · {formatDate(payment.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                Share
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
              >
                <Printer size={14} /> Print
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
              >
                <Download size={14} /> Download HTML
              </button>
            </div>
          </div>
        </div>

        {/* Payment summary card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <span className="text-emerald-500 font-bold text-lg">Q</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-50">QIEPay Invoice</p>
                <p className="text-xs text-slate-500">
                  QIE-{payment.id.toString().padStart(6, '0')}
                </p>
              </div>
            </div>
            <StatusBadge status={payment.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
            <div>
              <p className="text-slate-400 uppercase tracking-wider mb-1">From (Merchant)</p>
              <p className="text-slate-50 font-mono break-all">{payment.merchant}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wider mb-1">To (Customer)</p>
              <p className="text-slate-50 font-mono break-all">
                {payment.customer && payment.customer !== '0x0000000000000000000000000000000000000000'
                  ? payment.customer
                  : 'Pending Payment'}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-slate-300">{payment.description || 'Payment'}</span>
              <span className="text-sm font-semibold text-slate-50">
                {formatQIEAmount(payment.amount)} QIE
              </span>
            </div>
            {payment.orderId && (
              <p className="text-xs text-slate-500">Order: {payment.orderId}</p>
            )}
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-500">≈ {formatUSD(payment.amount)}</span>
            </div>
          </div>

          {payment.fee && parseFloat(payment.fee) > 0 && (
            <div className="flex justify-between items-center mt-3 text-xs">
              <span className="text-slate-400">Platform Fee (2.5%)</span>
              <span className="text-red-400">-{formatQIEAmount(payment.fee)} QIE</span>
            </div>
          )}

          {payment.settledAt > 0 && (
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-xs font-medium text-emerald-400">✓ Settled</p>
              <p className="text-xs text-slate-400 mt-1">
                Settlement completed on {formatDate(payment.settledAt)}
              </p>
            </div>
          )}
        </div>

        {/* Iframe preview */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <FileText size={14} /> Invoice Preview
            </span>
            {payment.txHash && (
              <a
                href={`${EXPLORER_URL}/tx/${payment.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
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
            style={{ minHeight: '800px', background: '#f8fafc' }}
            sandbox="allow-same-origin"
          />
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            to={`/pay/${id}`}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back to Payment
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
