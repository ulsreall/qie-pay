import { useState, useEffect, useCallback } from 'react';
import {
  connectWallet,
  getBalance,
  onAccountChange,
  checkConnection,
} from '../utils/contract';
import { useDemo } from '../context/DemoContext';
import { useEmailWallet, EmailLoginButton } from '../utils/email-wallet';
import { Wallet, LogOut, Copy, Check, RefreshCw, Eye, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const QIE_USD_RATE = 0.5; // Mock exchange rate

export default function WalletConnect({ compact = false, collapsed = false }) {
  const { isDemo, demoAddress, demoBalance, setConnected, setDisconnected } = useDemo();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-detect existing connection on mount
  useEffect(() => {
    checkConnection().then((connected) => {
      if (connected && !connected.isDemo) {
        setWallet(connected);
        setConnected(connected.address);
      }
    }).catch(() => {});

    const handleAccounts = (accounts) => {
      if (accounts.length === 0) {
        setWallet(null);
        setDisconnected();
        toast('Wallet disconnected', { icon: '🔌' });
      } else {
        checkConnection().then((w) => {
          if (w && !w.isDemo) {
            setWallet(w);
            setConnected(w.address);
          }
        }).catch(() => {});
      }
    };

    onAccountChange(handleAccounts);
  }, [setConnected, setDisconnected]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const result = await connectWallet();
      setWallet({ address: result.address, balance: result.balance });
      setConnected(result.address);
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
    setDisconnected();
    toast.success('Wallet disconnected');
  }, [setDisconnected]);

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
    const addr = wallet?.address || demoAddress;
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [wallet?.address, demoAddress]);

  const truncateAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}⋯${addr.slice(-4)}` : '';

  // Use demo values when no wallet is connected
  const displayAddress = wallet?.address || demoAddress;
  const displayBalance = wallet?.balance || demoBalance;
  const usdValue = displayBalance
    ? (parseFloat(displayBalance) * QIE_USD_RATE).toFixed(2)
    : '0.00';

  // ---- DEMO MODE (compact / sidebar) ----
  if (!wallet && isDemo && compact) {
    if (collapsed) {
      return (
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
            <Eye size={14} className="text-amber-400" />
          </div>
          <span className="text-[9px] text-amber-400 font-medium">Demo</span>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {/* Demo badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
          <Eye size={12} className="text-amber-400" />
          <span className="text-[10px] font-medium text-amber-400">Demo Mode</span>
        </div>

        {/* Address row */}
        <button
          onClick={copyAddress}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111113] border border-[#27272A] hover:border-[#3F3F46] transition-colors group"
        >
          <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span className="text-xs font-medium text-[#A1A1AA] truncate flex-1 text-left font-mono tabular-nums">
            {truncateAddress(displayAddress)}
          </span>
          {copied ? (
            <Check size={12} className="text-[#34D399] shrink-0" />
          ) : (
            <Copy
              size={12}
              className="text-[#71717A] group-hover:text-[#A1A1AA] shrink-0 transition-colors"
            />
          )}
        </button>

        {/* Balance row */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <div>
            <p className="text-xs text-[#71717A]">Balance</p>
            <p className="text-sm font-semibold text-[#34D399] tabular-nums">
              {parseFloat(displayBalance).toFixed(4)}{' '}
              <span className="text-[#A1A1AA] font-normal">QIE</span>
            </p>
            <p className="text-[11px] text-[#71717A]">≈ ${usdValue} USD</p>
          </div>
        </div>

        {/* Connect Wallet button to exit demo */}
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#10B981] hover:bg-[#059669] text-white font-medium transition-colors disabled:opacity-50"
        >
          <Wallet size={14} />
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting…
            </span>
          ) : (
            'Connect Wallet'
          )}
        </button>
      </div>
    );
  }

  // ---- DEMO MODE (full / navbar) ----
  if (!wallet && isDemo) {
    return (
      <div className="flex items-center gap-3">
        {/* Demo badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Eye size={14} className="text-amber-400" />
          <span className="text-xs font-medium text-amber-400">Demo</span>
        </div>

        {/* Balance pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111113] border border-[#27272A]">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-sm text-[#34D399] font-medium tabular-nums">
            {parseFloat(displayBalance).toFixed(4)} QIE
          </span>
          <span className="text-xs text-[#71717A]">(${usdValue})</span>
        </div>

        {/* Address with copy */}
        <button
          onClick={copyAddress}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111113] border border-[#27272A] hover:border-[#3F3F46] transition-colors"
        >
          <span className="text-xs font-medium text-[#A1A1AA] font-mono tabular-nums">
            {truncateAddress(displayAddress)}
          </span>
          {copied ? (
            <Check size={14} className="text-[#34D399]" />
          ) : (
            <Copy size={14} className="text-[#A1A1AA] hover:text-[#D4D4D8]" />
          )}
        </button>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Wallet size={14} />
          {loading ? 'Connecting…' : 'Connect'}
        </button>
      </div>
    );
  }

  // ---- Disconnected state (no demo, no wallet — fallback) ----
  if (!wallet) {
    return (
      <div className="space-y-2">
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
        {!compact && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#27272A]" />
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-[#09090B] px-2 text-[#52525B]">or</span>
            </div>
          </div>
        )}
        {!compact && <EmailLoginButton />}
      </div>
    );
  }

  // ---- Compact (sidebar) view — real wallet ----
  if (compact) {
    if (collapsed) {
      return (
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={copyAddress}
            className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center hover:bg-[#10B981]/20 transition-colors"
            title={wallet.address}
          >
            <div className="w-2 h-2 rounded-full bg-[#34D399]" />
          </button>
          <span className="text-[9px] text-[#34D399] font-medium tabular-nums">
            {parseFloat(wallet.balance).toFixed(1)}
          </span>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {/* Address row */}
        <button
          onClick={copyAddress}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111113] border border-[#27272A] hover:border-[#3F3F46] transition-colors group"
        >
          <div className="w-2 h-2 rounded-full bg-[#34D399] shrink-0" />
          <span className="text-xs font-medium text-[#A1A1AA] truncate flex-1 text-left font-mono tabular-nums">
            {truncateAddress(wallet.address)}
          </span>
          {copied ? (
            <Check size={12} className="text-[#34D399] shrink-0" />
          ) : (
            <Copy
              size={12}
              className="text-[#71717A] group-hover:text-[#A1A1AA] shrink-0 transition-colors"
            />
          )}
        </button>

        {/* Balance row */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <div>
            <p className="text-xs text-[#71717A]">Balance</p>
            <p className="text-sm font-semibold text-[#34D399] tabular-nums">
              {parseFloat(wallet.balance).toFixed(4)}{' '}
              <span className="text-[#A1A1AA] font-normal">QIE</span>
            </p>
            <p className="text-[11px] text-[#71717A]">≈ ${usdValue} USD</p>
          </div>
          <button
            onClick={refreshBalance}
            disabled={refreshing}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#D4D4D8] hover:bg-[#111113] transition-colors"
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
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={14} />
          Disconnect
        </button>
      </div>
    );
  }

  // ---- Full (navbar) view — real wallet ----
  return (
    <div className="flex items-center gap-3">
      {/* Balance pill */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111113] border border-[#27272A]">
        <div className="w-2 h-2 rounded-full bg-[#34D399]" />
        <span className="text-sm text-[#34D399] font-medium tabular-nums">
          {parseFloat(wallet.balance).toFixed(4)} QIE
        </span>
        <span className="text-xs text-[#71717A]">(${usdValue})</span>
      </div>

      {/* Address with copy */}
      <button
        onClick={copyAddress}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111113] border border-[#27272A] hover:border-[#3F3F46] transition-colors"
      >
        <span className="text-xs font-medium text-[#A1A1AA] font-mono tabular-nums">
          {truncateAddress(wallet.address)}
        </span>
        {copied ? (
          <Check size={14} className="text-[#34D399]" />
        ) : (
          <Copy size={14} className="text-[#A1A1AA] hover:text-[#D4D4D8]" />
        )}
      </button>

      {/* Refresh */}
      <button
        onClick={refreshBalance}
        disabled={refreshing}
        className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#D4D4D8] hover:bg-[#111113] transition-colors"
        title="Refresh balance"
      >
        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
      </button>

      {/* Disconnect */}
      <button
        onClick={handleDisconnect}
        className="p-2 text-[#A1A1AA] hover:text-red-400 transition-colors"
        title="Disconnect"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
