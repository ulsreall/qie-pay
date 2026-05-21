import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Info, Download, ExternalLink, Loader2,
  FileText, Copy, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { connectWallet, checkConnection, isMerchant, getMerchantPayments } from '../utils/contract';
import { CHAIN_ID, CHAIN_NAME, RPC_URL, CONTRACT_ADDRESS, EXPLORER_URL } from '../utils/constants';
import { exportPaymentsCSV } from '../utils/export';
import { downloadInvoice } from '../utils/invoice';

export default function Settings() {
  const [wallet, setWallet] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingInvoices, setExportingInvoices] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      const connected = await checkConnection();
      if (connected) {
        setWallet(connected);
        const reg = await isMerchant(connected.address);
        setRegistered(reg);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    try {
      const result = await connectWallet();
      setWallet({ address: result.address, balance: result.balance });
      const reg = await isMerchant(result.address);
      setRegistered(reg);
      toast.success('Wallet connected');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExport = async () => {
    if (!wallet) { toast.error('Connect wallet first'); return; }
    setExporting(true);
    try {
      toast.loading('Fetching payments...', { id: 'export' });
      const payments = await getMerchantPayments(wallet.address);
      exportPaymentsCSV(payments, `qie-payments-${wallet.address.slice(0, 8)}`);
      toast.dismiss('export');
      toast.success(`Exported ${payments.length} payments`);
    } catch (err) {
      toast.error('Export failed');
    }
    setExporting(false);
  };

  const handleExportInvoices = async () => {
    if (!wallet) { toast.error('Connect wallet first'); return; }
    setExportingInvoices(true);
    try {
      toast.loading('Generating invoices...', { id: 'export-invoices' });
      const payments = await getMerchantPayments(wallet.address);
      const paidPayments = payments.filter((p) => p.status >= 1);

      if (paidPayments.length === 0) {
        toast.dismiss('export-invoices');
        toast.error('No paid payments to generate invoices for');
        setExportingInvoices(false);
        return;
      }

      for (const payment of paidPayments) {
        downloadInvoice(payment, wallet.address);
        await new Promise((r) => setTimeout(r, 300));
      }

      toast.dismiss('export-invoices');
      toast.success(`Downloaded ${paidPayments.length} invoices`);
    } catch (err) {
      toast.error('Invoice export failed');
    }
    setExportingInvoices(false);
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('Copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const truncateAddress = (addr) => addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : '—';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="p-6 lg:p-8"
    >
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-50 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Account information and platform settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
        {/* Merchant Info Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={14} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-300">Merchant Info</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={18} className="animate-spin text-emerald-500" />
            </div>
          ) : wallet ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Wallet Address</label>
                <div className="flex items-center gap-2 bg-slate-900 rounded-md px-3 py-2 border border-slate-700">
                  <span className="text-xs text-slate-300 font-mono break-all flex-1">
                    {wallet.address}
                  </span>
                  <button
                    onClick={() => handleCopy(wallet.address, 'wallet')}
                    className="p-1 rounded hover:bg-slate-700 transition-colors flex-shrink-0"
                  >
                    {copied === 'wallet'
                      ? <Check size={12} className="text-emerald-400" />
                      : <Copy size={12} className="text-slate-500" />
                    }
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                <span className="text-xs text-slate-400">Balance</span>
                <span className="text-xs text-slate-300 font-medium tabular-nums">
                  {parseFloat(wallet.balance).toFixed(4)} QIE
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-400">Merchant Status</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${registered ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className={`text-xs font-medium ${registered ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {registered ? 'Registered' : 'Not Registered'}
                  </span>
                </div>
              </div>

              <a
                href={`${EXPLORER_URL}/address/${wallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                View on Explorer <ExternalLink size={11} />
              </a>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-400 text-xs mb-3">Connect your wallet to view account settings</p>
              <button
                onClick={handleConnect}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md px-4 py-2 text-xs transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>

        {/* Platform Info Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info size={14} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-300">Platform Info</h2>
          </div>

          <div>
            <InfoRow label="Platform Fee" value="2.5%" />
            <InfoRow label="Settlement" value="Manual (merchant settles)" />
            <InfoRow label="Min Payment" value="0.001 QIE" />
            <InfoRow label="Network" value={CHAIN_NAME} />
            <InfoRow label="Chain ID" value={CHAIN_ID.toString()} />
            <InfoRow label="RPC URL" value={RPC_URL} mono />
            <div className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
              <span className="text-xs text-slate-400">Contract</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-300 font-mono">
                  {truncateAddress(CONTRACT_ADDRESS)}
                </span>
                <button
                  onClick={() => handleCopy(CONTRACT_ADDRESS, 'contract')}
                  className="p-0.5 rounded hover:bg-slate-700 transition-colors"
                >
                  {copied === 'contract'
                    ? <Check size={11} className="text-emerald-400" />
                    : <Copy size={11} className="text-slate-500" />
                  }
                </button>
              </div>
            </div>
          </div>

          <a
            href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 transition-colors mt-3"
          >
            View Contract on Explorer <ExternalLink size={11} />
          </a>
        </div>

        {/* Export CSV Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Download size={14} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-300">Export Data</h2>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Download all your payment history as CSV for accounting.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting || !wallet}
            className="inline-flex items-center gap-1.5 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-md px-3 py-1.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting
              ? <><Loader2 size={12} className="animate-spin" /> Exporting...</>
              : <><Download size={12} /> Export Transactions (CSV)</>
            }
          </button>
        </div>

        {/* Export Invoices Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-300">Export Invoices</h2>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Download HTML invoices for all paid and settled transactions.
          </p>
          <button
            onClick={handleExportInvoices}
            disabled={exportingInvoices || !wallet}
            className="inline-flex items-center gap-1.5 border border-slate-600 hover:border-slate-500 text-slate-300 rounded-md px-3 py-1.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingInvoices
              ? <><Loader2 size={12} className="animate-spin" /> Generating...</>
              : <><FileText size={12} /> Download All Invoices</>
            }
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs text-slate-300 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
