import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Shield, Network, Download, Info, ExternalLink, Loader2,
  FileText, Copy, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { connectWallet, checkConnection, isMerchant, getMerchantPayments } from '../utils/contract';
import { CHAIN_ID, CHAIN_NAME, RPC_URL, CONTRACT_ADDRESS, BLOCK_EXPLORER } from '../utils/constants';
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

      // Download each invoice
      for (const payment of paidPayments) {
        downloadInvoice(payment, wallet.address);
        // Small delay between downloads to avoid browser blocking
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

  const truncateAddress = (addr) => addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : '-';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Account information and platform settings</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Account */}
        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <User size={20} className="text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Account</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-purple-400" />
            </div>
          ) : wallet ? (
            <div className="space-y-4">
              <div className="glass-light p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-500">Wallet Address</p>
                  <button
                    onClick={() => handleCopy(wallet.address, 'wallet')}
                    className="p-1 rounded hover:bg-white/5 transition-colors"
                  >
                    {copied === 'wallet' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-500" />}
                  </button>
                </div>
                <p className="text-sm text-white font-mono break-all">{wallet.address}</p>
              </div>
              <div className="glass-light p-4">
                <p className="text-xs text-slate-500 mb-1">Balance</p>
                <p className="text-sm text-white">{parseFloat(wallet.balance).toFixed(4)} QIE</p>
              </div>
              <div className="glass-light p-4">
                <p className="text-xs text-slate-500 mb-1">Merchant Status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${registered ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className={`text-sm ${registered ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {registered ? 'Registered Merchant' : 'Not Registered'}
                  </span>
                </div>
              </div>
              <a href={`${BLOCK_EXPLORER}/address/${wallet.address}`} target="_blank" rel="noopener noreferrer" className="btn-ghost flex items-center gap-2 text-sm text-purple-400">
                View on Explorer <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">Connect your wallet to view account settings</p>
              <button onClick={handleConnect} className="btn-primary">Connect Wallet</button>
            </div>
          )}
        </div>

        {/* Platform */}
        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <Info size={20} className="text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Platform Info</h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Platform Fee" value="2.5%" />
            <InfoRow label="Settlement" value="Manual (merchant settles)" />
            <InfoRow label="Min Payment" value="0.001 QIE" />
          </div>
        </div>

        {/* Network */}
        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <Network size={20} className="text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Network</h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Network" value={CHAIN_NAME} />
            <InfoRow label="Chain ID" value={CHAIN_ID.toString()} />
            <InfoRow label="RPC URL" value={RPC_URL} mono />
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-slate-400">Contract</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-mono">{truncateAddress(CONTRACT_ADDRESS)}</span>
                <button
                  onClick={() => handleCopy(CONTRACT_ADDRESS, 'contract')}
                  className="p-1 rounded hover:bg-white/5 transition-colors"
                >
                  {copied === 'contract' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-500" />}
                </button>
              </div>
            </div>
            <a href={`${BLOCK_EXPLORER}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="btn-ghost flex items-center gap-2 text-sm text-purple-400">
              View Contract on Explorer <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Export Transactions */}
        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download size={20} className="text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Export Data</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Download all your payment history as a CSV file</p>
          <button onClick={handleExport} disabled={exporting || !wallet} className="btn-secondary flex items-center gap-2 text-sm">
            {exporting ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : <><Download size={14} /> Export Transactions (CSV)</>}
          </button>
        </div>

        {/* Export Invoices */}
        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={20} className="text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Export Invoices</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Download HTML invoices for all paid and settled transactions.
            Each invoice includes merchant details, amounts, and QIE Testnet transaction info.
          </p>
          <button
            onClick={handleExportInvoices}
            disabled={exportingInvoices || !wallet}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {exportingInvoices ? (
              <><Loader2 size={14} className="animate-spin" /> Generating Invoices...</>
            ) : (
              <><FileText size={14} /> Download All Invoices</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm text-white ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
