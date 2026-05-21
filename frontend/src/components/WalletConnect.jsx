import { useState, useEffect } from 'react';
import { connectWallet, getBalance, onAccountChange, checkConnection } from '../utils/contract';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';

export default function WalletConnect() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkConnection().then((connected) => {
      if (connected) setWallet(connected);
    });

    onAccountChange((accounts) => {
      if (accounts.length === 0) {
        setWallet(null);
      } else {
        checkConnection().then(setWallet);
      }
    });
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const result = await connectWallet();
      setWallet({
        address: result.address,
        balance: result.balance,
      });
    } catch (err) {
      console.error('Connection failed:', err);
      alert(err.message);
    }
    setLoading(false);
  };

  const handleDisconnect = () => {
    setWallet(null);
  };

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!wallet) {
    return (
      <button
        onClick={handleConnect}
        disabled={loading}
        className="btn-primary flex items-center gap-2"
      >
        <Wallet size={18} />
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm text-gray-300">
          {parseFloat(wallet.balance).toFixed(4)} QIE
        </span>
      </div>

      <button
        onClick={copyAddress}
        className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700 hover:border-primary-500 transition-colors"
      >
        <span className="text-sm font-medium">
          {truncateAddress(wallet.address)}
        </span>
        {copied ? (
          <Check size={14} className="text-green-400" />
        ) : (
          <Copy size={14} className="text-gray-400" />
        )}
      </button>

      <button
        onClick={handleDisconnect}
        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
        title="Disconnect"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
