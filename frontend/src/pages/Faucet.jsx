import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Clock, CheckCircle, ExternalLink, Wallet, Mail, ArrowRight } from 'lucide-react';
import { checkConnection } from '../utils/contract';
import toast from 'react-hot-toast';

const FAUCET_API = '/api/faucet';
const EXPLORER = 'https://testnet.qie.digital';

export default function Faucet() {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dripResult, setDripResult] = useState(null);
  const [checking, setChecking] = useState(false);

  // Auto-detect wallet + check status immediately
  useEffect(() => {
    checkConnection().then(async (conn) => {
      if (conn && conn.address) {
        setAddress(conn.address);
        const s = await checkStatus(conn.address);
        // If already claimed (on cooldown), show "already received" state silently
        if (s && !s.canDrip) {
          setDripResult({ alreadyClaimed: true, amount: s.dripAmount });
        }
      }
    }).catch(() => {});
  }, []);

  const checkStatus = async (addr) => {
    if (!addr) return null;
    setChecking(true);
    try {
      const res = await fetch(`${FAUCET_API}/status/${addr}`);
      const data = await res.json();
      setStatus(data);
      return data;
    } catch {
      setStatus(null);
      return null;
    } finally {
      setChecking(false);
    }
  };

  const handleDrip = async () => {
    if (!address) {
      toast.error('Connect wallet or enter address');
      return;
    }
    setLoading(true);
    setDripResult(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout
      const res = await fetch(`${FAUCET_API}/drip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.success) {
        setDripResult(data);
        toast.success(`+${data.amount} QIE sent!`);
        checkStatus(address); // refresh cooldown
      } else if (data.error && data.error.includes('claimed')) {
        // Already claimed — just refresh status, no error toast
        checkStatus(address);
      } else {
        toast.error(data.error || 'Faucet request failed');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        toast.error('Request timeout — try again');
      } else {
        toast.error('Network error');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#FAFAFA] flex items-center gap-2">
          <Droplets size={20} className="text-[#10B981]" />
          Testnet Faucet
        </h1>
        <p className="text-sm text-[#A1A1AA] mt-1">
          Get free QIE tokens to test on QIE Testnet (Chain ID 1983)
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Droplets size={18} className="text-[#10B981] mt-0.5 shrink-0" />
          <div className="text-sm text-[#A1A1AA] space-y-1">
            <p className="text-[#FAFAFA] font-medium">How it works</p>
            <p>Each address can receive <span className="text-[#10B981] font-medium">2 QIE</span> every 24 hours. New email wallets are auto-funded on creation.</p>
            <p>This is a <span className="text-[#FAFAFA]">decentralized on-chain faucet</span> — no backend keys stored in the frontend.</p>
          </div>
        </div>
      </div>

      {/* Faucet Card */}
      <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 space-y-4">
        {/* Address Input */}
        <div>
          <label className="block text-xs text-[#A1A1AA] mb-1.5">Wallet Address</label>
          <div className="relative">
            <Wallet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
            <input
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setStatus(null); setDripResult(null); }}
              placeholder="0x..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#09090B] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] font-mono"
            />
          </div>
          <p className="text-[11px] text-[#52525B] mt-1">
            Auto-filled if wallet is connected. Email wallets get auto-funded on creation.
          </p>
        </div>

        {/* Status */}
        {status && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            status.canDrip 
              ? 'bg-[#10B981]/10 text-[#10B981]' 
              : 'bg-[#F59E0B]/10 text-[#F59E0B]'
          }`}>
            {status.canDrip ? (
              <>
                <CheckCircle size={14} />
                <span>Ready to claim — {status.dripAmount} QIE available</span>
              </>
            ) : (
              <>
                <Clock size={14} />
                <span>Cooldown active — try again in {formatTime(status.waitSeconds)}</span>
              </>
            )}
          </div>
        )}

        {/* Drip Result */}
        {dripResult && (
          <div className={`border rounded-lg p-4 space-y-2 ${
            dripResult.alreadyClaimed 
              ? 'bg-[#F59E0B]/10 border-[#F59E0B]/20' 
              : 'bg-[#10B981]/10 border-[#10B981]/20'
          }`}>
            <div className={`flex items-center gap-2 font-medium text-sm ${
              dripResult.alreadyClaimed ? 'text-[#F59E0B]' : 'text-[#10B981]'
            }`}>
              <CheckCircle size={16} />
              {dripResult.alreadyClaimed ? 'Already Received' : 'Tokens Sent!'}
            </div>
            <div className="text-sm text-[#A1A1AA] space-y-1">
              <p>Amount: <span className="text-[#FAFAFA]">{dripResult.amount} QIE</span></p>
              {dripResult.to && (
                <>
                  <p>To: <span className="text-[#FAFAFA] font-mono text-xs">{dripResult.to}</span></p>
                  <a
                    href={`${EXPLORER}/tx/${dripResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#10B981] hover:underline text-xs"
                  >
                    View on Explorer <ExternalLink size={12} />
                  </a>
                </>
              )}
              {dripResult.alreadyClaimed && (
                <p className="text-xs text-[#52525B]">You can claim again after cooldown expires.</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => checkStatus(address)}
            disabled={!address || checking}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[#27272A] text-[#A1A1AA] text-sm rounded-lg hover:border-[#3F3F46] transition-colors disabled:opacity-50"
          >
            {checking ? (
              <span className="w-4 h-4 border-2 border-[#27272A] border-t-[#A1A1AA] rounded-full animate-spin" />
            ) : (
              <Clock size={14} />
            )}
            Check Status
          </button>
          <button
            onClick={handleDrip}
            disabled={!address || loading || (status && !status.canDrip)}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Droplets size={14} />
                Claim 2 QIE
              </>
            )}
          </button>
        </div>
      </div>

      {/* Email Wallet CTA */}
      <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
            <Mail size={16} className="text-[#10B981]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#FAFAFA]">Don't have a wallet?</h3>
            <p className="text-xs text-[#A1A1AA]">Create one with just your email — auto-funded!</p>
          </div>
        </div>
        <a
          href="/"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#09090B] border border-[#27272A] hover:border-[#10B981] text-sm text-[#FAFAFA] rounded-lg transition-colors"
        >
          Create Email Wallet <ArrowRight size={14} />
        </a>
      </div>

      {/* Contract Info */}
      <div className="bg-[#111113] border border-[#27272A] rounded-lg p-4 space-y-2">
        <h3 className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Faucet Contract</h3>
        <a
          href={`${EXPLORER}/address/0xe0BC1D6CC58E091F6A2866788D7D938895E1E2a6`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-[#10B981] hover:underline font-mono"
        >
          0xe0BC1D6C...95E1E2a6 <ExternalLink size={12} />
        </a>
        <p className="text-xs text-[#52525B]">109.5 QIE funded • 2 QIE per drip • 24h cooldown</p>
      </div>
    </motion.div>
  );
}
