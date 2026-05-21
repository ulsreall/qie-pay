import { useState, useEffect, useCallback } from 'react';
import {
  connectWallet,
  getBalance,
  onAccountChange,
  checkConnection,
} from '../utils/contract';
import { Wallet, LogOut, Copy, Check, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const QIE_USD_RATE = 0.5; // Mock exchange rate

export default function WalletConnect({ compact = false }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-detect existing connection on mount
  useEffect(() => {
    checkConnection().then((connected) => {
      if (connected) setWallet(connected);
    });

    const handleAccounts = (accounts) => {
      if (accounts.length === 0) {
        setWallet(null);
        toast('Wallet disconnected', { icon: '🔌' });
      } else {
        checkConnection().then((w) => {
          if (w) setWallet(w);
        });
      }
    };

    onAccountChange(handleAccounts);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const result = await connectWallet();
      setWallet({ address: result.address, balance: result.balance });
      toast.success('Wallet connected');
    } catch (err) {
      console.error('Connection failed:', err);
      toast.error(err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = useCallback(() => {
    setWallet(null);
    toast.success('Wallet disconnected');
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!wallet?.address) return;
    setRefreshing(true);
    try {
      const bal = await getBalance(wallet.address);
      setWallet((prev) => (prev ? { ...prev, balance: bal } : prev));
    } catch {
      // silently fail
    } finally {
      setRefreshing(false);
    }
  }, [wallet?.address]);

  const copyAddress = useCallback(() => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [wallet?.address]);

  const truncateAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}⋯${addr.slice(-4)}` : '';

  const usdValue = wallet?.balance
    ? (parseFloat(wallet.balance) * QIE_USD_RATE).toFixed(2)
    : '0.00';

  // ---- Disconnected state ----
  if (!wallet) {
    return (
      <button
        onClick={handleConnect}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
      >
        <Wallet size={16} />
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Connecting…
          </span>
        ) : compact ? (
          'Connect'
        ) : (
          'Connect Wallet'
        )}
      </button>
    );
  }

  // ---- Compact (sidebar) view ----
  if (compact) {
    return (
      <div className="space-y-2">
        {/* Address row */}
        <button
          onClick={copyAddress}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors group"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-slate-300 truncate flex-1 text-left font-mono tabular-nums">
            {truncateAddress(wallet.address)}
          </span>
          {copied ? (
            <Check size={12} className="text-emerald-400 shrink-0" />
          ) : (
            <Copy
              size={12}
              className="text-slate-500 group-hover:text-slate-300 shrink-0 transition-colors"
            />
          )}
        </button>

        {/* Balance row */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <div>
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-sm font-semibold text-emerald-400 tabular-nums">
              {parseFloat(wallet.balance).toFixed(4)}{' '}
              <span className="text-slate-400 font-normal">QIE</span>
            </p>
            <p className="text-[11px] text-slate-500">≈ ${usdValue} USD</p>
          </div>
          <button
            onClick={refreshBalance}
            disabled={refreshing}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Refresh balance"
          >
            <RefreshCw
              size={14}
              className={refreshing ? 'animate-spin' : ''}
            />
          </button>
        </div>

        {/* Disconnect */}
        <button
          onClick={handleDisconnect}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={14} />
          Disconnect
        </button>
      </div>
    );
  }

  // ---- Full (navbar) view ----
  return (
    <div className="flex items-center gap-3">
      {/* Balance pill */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-sm text-emerald-400 font-medium tabular-nums">
          {parseFloat(wallet.balance).toFixed(4)} QIE
        </span>
        <span className="text-xs text-slate-500">(${usdValue})</span>
      </div>

      {/* Address with copy */}
      <button
        onClick={copyAddress}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors"
      >
        <span className="text-xs font-medium text-slate-300 font-mono tabular-nums">
          {truncateAddress(wallet.address)}
        </span>
        {copied ? (
          <Check size={14} className="text-emerald-400" />
        ) : (
          <Copy size={14} className="text-slate-400 hover:text-slate-200" />
        )}
      </button>

      {/* Refresh */}
      <button
        onClick={refreshBalance}
        disabled={refreshing}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        title="Refresh balance"
      >
        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
      </button>

      {/* Disconnect */}
      <button
        onClick={handleDisconnect}
        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
        title="Disconnect"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
