import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Shield, Network, Download, Info, ExternalLink, Loader2,
  FileText, Copy, Check, Globe, Hash,
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-8"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Account information and platform settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Merchant Info Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <User size={18} className="text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-50">Merchant Info</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-emerald-500" />
            </div>
          ) : wallet ? (
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-1.5 block">Wallet Address</label>
                <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-4 py-2.5 border border-slate-700">
                  <span className="text-sm text-slate-50 font-mono break-all flex-1">
                    {wallet.address}
                  </span>
                  <button
                    onClick={() => handleCopy(wallet.address, 'wallet')}
                    className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0"
                  >
                    {copied === 'wallet'
                      ? <Check size={14} className="text-emerald-400" />
                      : <Copy size={14} className="text-slate-500" />
                    }
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <span className="text-sm text-slate-400">Balance</span>
                <span className="text-sm text-slate-50 font-medium">
                  {parseFloat(wallet.balance).toFixed(4)} QIE
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-400">Merchant Status</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${registered ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className={`text-sm font-medium ${registered ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {registered ? 'Registered' : 'Not Registered'}
                  </span>
                </div>
              </div>

              <a
                href={`${EXPLORER_URL}/address/${wallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 transition-colors"
              >
                View on Explorer <ExternalLink size={13} />
              </a>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4 text-sm">Connect your wallet to view account settings</p>
              <button
                onClick={handleConnect}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-5 py-2.5 text-sm transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>

        {/* Platform Info Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-sky-500/10 rounded-lg flex items-center justify-center">
              <Info size={18} className="text-sky-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-50">Platform Info</h2>
          </div>

          <div className="space-y-0">
            <InfoRow label="Platform Fee" value="2.5%" />
            <InfoRow label="Settlement" value="Manual (merchant settles)" />
            <InfoRow label="Min Payment" value="0.001 QIE" />
            <InfoRow label="Network" value={CHAIN_NAME} />
            <InfoRow label="Chain ID" value={CHAIN_ID.toString()} />
            <InfoRow label="RPC URL" value={RPC_URL} mono />
            <div className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
              <span className="text-sm text-slate-400">Contract</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-50 font-mono">
                  {truncateAddress(CONTRACT_ADDRESS)}
                </span>
                <button
                  onClick={() => handleCopy(CONTRACT_ADDRESS, 'contract')}
                  className="p-1 rounded hover:bg-slate-700 transition-colors"
                >
                  {copied === 'contract'
                    ? <Check size={12} className="text-emerald-400" />
                    : <Copy size={12} className="text-slate-500" />
                  }
                </button>
              </div>
            </div>
          </div>

          <a
            href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 transition-colors mt-4"
          >
            View Contract on Explorer <ExternalLink size={13} />
          </a>
        </div>

        {/* Export CSV Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <Download size={18} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-50">Export Data</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Download all your payment history as a CSV file for accounting and record-keeping.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting || !wallet}
            className="inline-flex items-center gap-2 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting
              ? <><Loader2 size={14} className="animate-spin" /> Exporting...</>
              : <><Download size={14} /> Export Transactions (CSV)</>
            }
          </button>
        </div>

        {/* Export Invoices Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-50">Export Invoices</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Download HTML invoices for all paid and settled transactions. Each invoice includes merchant details, amounts, and transaction info.
          </p>
          <button
            onClick={handleExportInvoices}
            disabled={exportingInvoices || !wallet}
            className="inline-flex items-center gap-2 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingInvoices
              ? <><Loader2 size={14} className="animate-spin" /> Generating Invoices...</>
              : <><FileText size={14} /> Download All Invoices</>
            }
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm text-slate-50 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
