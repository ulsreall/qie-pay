import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Gift, Flame, ArrowUpRight, History, Info, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { checkConnection } from '../utils/contract';
import {
  getQIEPBalance,
  transferQIEP,
  burnQIEPForDiscount,
  getDiscountInfo,
  addQIEPToWallet,
} from '../utils/defi-contract';
import { ethers } from 'ethers';
import { QIEP_PER_PAYMENT, BURN_COST, DISCOUNT_PERCENT } from '../utils/defi-constants';

const DEMO_BALANCE = 47;
const DEMO_HISTORY = [
  { id: 1, type: 'earn', amount: 1, description: 'Payment received', date: new Date(Date.now() - 3600000) },
  { id: 2, type: 'earn', amount: 1, description: 'Payment received', date: new Date(Date.now() - 7200000) },
  { id: 3, type: 'burn', amount: 10, description: 'Burned for 10% discount', date: new Date(Date.now() - 86400000) },
  { id: 4, type: 'earn', amount: 1, description: 'Payment received', date: new Date(Date.now() - 172800000) },
  { id: 5, type: 'earn', amount: 1, description: 'Payment received', date: new Date(Date.now() - 259200000) },
];

const STORAGE_KEY = 'qiep_rewards_history';

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // silent
  }
}

export default function Rewards() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [showBurnConfirm, setShowBurnConfirm] = useState(false);
  const [discount, setDiscount] = useState({ discountPercent: 0, expiresAt: 0, hasDiscount: false });

  const loadData = useCallback(async () => {
    try {
      const conn = await checkConnection();
      setIsDemo(conn.isDemo);

      if (conn.isDemo) {
        setBalance(DEMO_BALANCE);
        const localHistory = loadHistory();
        setHistory(localHistory.length > 0 ? localHistory : DEMO_HISTORY);
        setDiscount({ discountPercent: 0, expiresAt: 0, hasDiscount: false });
        return;
      }

      const [bal, disc] = await Promise.all([
        getQIEPBalance(conn.address).catch(() => 0n),
        getDiscountInfo(conn.address).catch(() => ({ discountPercent: 0, expiresAt: 0, hasDiscount: false })),
      ]);

      // Convert from wei to QIEP (18 decimals)
      // Use parseFloat on string to avoid BigInt precision loss
      const balQIEP = parseFloat(bal.toString()) / 1e18;
      setBalance(balQIEP);
      setDiscount(disc);

      const localHistory = loadHistory();
      setHistory(localHistory);
    } catch (err) {
      console.error('Failed to load rewards:', err);
      setBalance(DEMO_BALANCE);
      setHistory(DEMO_HISTORY);
      setIsDemo(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTransfer = async () => {
    if (!transferTo || !ethers.isAddress(transferTo)) {
      toast.error('Enter a valid address');
      return;
    }
    if (!transferAmount || isNaN(Number(transferAmount)) || Number(transferAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (Number(transferAmount) > balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (isDemo) {
      setBalance((prev) => prev - Number(transferAmount));
      const entry = {
        id: Date.now(),
        type: 'transfer',
        amount: Number(transferAmount),
        description: `Sent to ${transferTo.slice(0, 6)}...${transferTo.slice(-4)}`,
        date: new Date(),
      };
      setHistory((prev) => {
        const next = [entry, ...prev];
        saveHistory(next);
        return next;
      });
      setShowTransfer(false);
      setTransferTo('');
      setTransferAmount('');
      toast.success(`Transferred ${transferAmount} QIEP (demo)`);
      return;
    }

    setLoading(true);
    try {
      await transferQIEP(transferTo, ethers.parseUnits(transferAmount, 18));
      const entry = {
        id: Date.now(),
        type: 'transfer',
        amount: Number(transferAmount),
        description: `Sent to ${transferTo.slice(0, 6)}...${transferTo.slice(-4)}`,
        date: new Date(),
      };
      setHistory((prev) => {
        const next = [entry, ...prev];
        saveHistory(next);
        return next;
      });
      setShowTransfer(false);
      setTransferTo('');
      setTransferAmount('');
      toast.success(`Transferred ${transferAmount} QIEP`);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBurn = async () => {
    if (balance < BURN_COST) {
      toast.error(`Need ${BURN_COST} QIEP to burn`);
      return;
    }

    if (isDemo) {
      setBalance((prev) => prev - BURN_COST);
      setDiscount({ discountPercent: DISCOUNT_PERCENT, expiresAt: Math.floor(Date.now() / 1000) + 86400, hasDiscount: true });
      const entry = {
        id: Date.now(),
        type: 'burn',
        amount: BURN_COST,
        description: `Burned for ${DISCOUNT_PERCENT}% discount`,
        date: new Date(),
      };
      setHistory((prev) => {
        const next = [entry, ...prev];
        saveHistory(next);
        return next;
      });
      setShowBurnConfirm(false);
      toast.success(`${DISCOUNT_PERCENT}% discount activated! (demo)`);
      return;
    }

    setLoading(true);
    try {
      await burnQIEPForDiscount();
      const entry = {
        id: Date.now(),
        type: 'burn',
        amount: BURN_COST,
        description: `Burned for ${DISCOUNT_PERCENT}% discount`,
        date: new Date(),
      };
      setHistory((prev) => {
        const next = [entry, ...prev];
        saveHistory(next);
        return next;
      });
      setShowBurnConfirm(false);
      toast.success(`${DISCOUNT_PERCENT}% discount activated!`);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Burn failed');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'earn': return <ArrowUpRight size={12} className="text-[#10B981]" />;
      case 'burn': return <Flame size={12} className="text-[#F59E0B]" />;
      case 'transfer': return <Send size={12} className="text-[#3B82F6]" />;
      default: return <Gift size={12} className="text-[#71717A]" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[#FAFAFA]">QIEP Rewards</h1>
        <p className="text-xs text-[#A1A1AA] mt-0.5">Earn tokens on every payment</p>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-[#111113] border border-[#27272A] rounded-lg p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gift size={16} className="text-[#10B981]" />
              <p className="text-xs text-[#71717A]">QIEP Balance</p>
            </div>
            <p className="text-4xl font-bold text-[#FAFAFA] tabular-nums tracking-tight">
              {balance.toLocaleString()}
              <span className="text-sm font-normal text-[#A1A1AA] ml-2">QIEP</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  await addQIEPToWallet();
                  toast.success('QIEP added to wallet');
                } catch {
                  toast.error('Failed to add token');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#27272A] hover:border-[#10B981] text-[#10B981] text-xs font-medium rounded-md transition-colors duration-150"
            >
              <Gift size={12} />
              + Add to Wallet
            </button>
            <button
              onClick={() => setShowTransfer(!showTransfer)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#27272A] hover:border-[#3F3F46] text-[#A1A1AA] text-sm font-medium rounded-md transition-colors duration-150"
            >
              <Send size={14} />
              Transfer
            </button>
          </div>
        </div>

        {/* Transfer form */}
        {showTransfer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.15 }}
            className="mt-4 pt-4 border-t border-[#27272A] space-y-3"
          >
            <div>
              <label className="text-xs text-[#71717A] mb-1.5 block">Recipient Address</label>
              <input
                type="text"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="0x..."
                className="w-full bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-[#71717A] mb-1.5 block">Amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="QIEP amount"
                  min="1"
                  className="flex-1 bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors tabular-nums"
                />
                <button
                  onClick={handleTransfer}
                  disabled={loading}
                  className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-md transition-colors duration-150 disabled:opacity-50"
                >
                  {loading ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* How It Works */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="bg-[#111113] border border-[#27272A] rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
              <ArrowUpRight size={14} className="text-[#10B981]" />
            </div>
            <h3 className="text-sm font-semibold text-[#FAFAFA]">Earn</h3>
          </div>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Pay with QIE → Earn <span className="text-[#10B981] font-medium">{QIEP_PER_PAYMENT} QIEP</span> per payment.
            Tokens are minted automatically.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: 0.05 }}
          className="bg-[#111113] border border-[#27272A] rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-[rgba(245,158,11,0.1)] flex items-center justify-center">
              <Flame size={14} className="text-[#F59E0B]" />
            </div>
            <h3 className="text-sm font-semibold text-[#FAFAFA]">Burn</h3>
          </div>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Burn <span className="text-[#F59E0B] font-medium">{BURN_COST} QIEP</span> → Get{' '}
            <span className="text-[#F59E0B] font-medium">{DISCOUNT_PERCENT}% discount</span> on your next payment.
          </p>
        </motion.div>
      </div>

      {/* Burn for Discount */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-[#111113] border border-[#27272A] rounded-lg p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-[#F59E0B]" />
            <h2 className="text-sm font-semibold text-[#FAFAFA]">Burn for Discount</h2>
          </div>
          {discount.hasDiscount && (
            <span className="text-[10px] bg-[rgba(245,158,11,0.15)] text-[#F59E0B] px-2 py-0.5 rounded-full font-medium">
              Active — {discount.discountPercent}% off
            </span>
          )}
        </div>

        {discount.hasDiscount ? (
          <p className="text-xs text-[#A1A1AA]">
            You have a <span className="text-[#F59E0B] font-medium">{discount.discountPercent}% discount</span> active.
            Apply it to your next payment to save on fees.
          </p>
        ) : (
          <>
            <p className="text-xs text-[#A1A1AA] mb-3">
              Burn {BURN_COST} QIEP to get a {DISCOUNT_PERCENT}% discount on your next payment fee.
              You need at least {BURN_COST} QIEP in your balance.
            </p>
            {showBurnConfirm ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBurn}
                  disabled={loading || balance < BURN_COST}
                  className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white text-sm font-medium rounded-md transition-colors duration-150 disabled:opacity-50"
                >
                  {loading ? 'Burning...' : `Confirm — Burn ${BURN_COST} QIEP`}
                </button>
                <button
                  onClick={() => setShowBurnConfirm(false)}
                  className="text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowBurnConfirm(true)}
                disabled={balance < BURN_COST}
                className="px-4 py-2 bg-[rgba(245,158,11,0.15)] hover:bg-[rgba(245,158,11,0.25)] text-[#F59E0B] text-sm font-medium rounded-md transition-colors duration-150 disabled:opacity-50"
              >
                {balance < BURN_COST ? `Need ${BURN_COST} QIEP` : `Burn ${BURN_COST} QIEP`}
              </button>
            )}
          </>
        )}
      </motion.div>

      {/* Rewards History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History size={14} className="text-[#52525B]" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#52525B]">
            Rewards History
          </h2>
        </div>
        {history.length === 0 ? (
          <div className="bg-[#111113] border border-[#27272A] rounded-lg p-6 text-center">
            <Gift size={20} className="text-[#52525B] mx-auto mb-2" />
            <p className="text-xs text-[#71717A]">No rewards history yet</p>
          </div>
        ) : (
          <div className="bg-[#111113] border border-[#27272A] rounded-lg divide-y divide-[#1E1E21]">
            {history.slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-[#09090B] flex items-center justify-center">
                    {getTypeIcon(entry.type)}
                  </div>
                  <div>
                    <p className="text-xs text-[#FAFAFA]">{entry.description}</p>
                    <p className="text-[10px] text-[#52525B]">
                      {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium tabular-nums ${
                    entry.type === 'earn' ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }`}
                >
                  {entry.type === 'earn' ? '+' : '-'}{entry.amount} QIEP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#111113] border border-[#27272A]">
          <Info size={14} className="text-[#71717A] shrink-0" />
          <p className="text-xs text-[#71717A]">
            Demo mode — connect a wallet to interact with rewards contract
          </p>
        </div>
      )}
    </div>
  );
}
