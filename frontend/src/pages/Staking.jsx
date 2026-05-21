import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, Users, ArrowUpRight, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { STAKING_TIERS } from '../utils/defi-constants';
import { checkConnection } from '../utils/contract';
import {
  stakeQIE,
  unstakeQIE,
  getStakeBalance,
  getFeeRate,
  getTotalStaked,
  getStakerCount,
} from '../utils/defi-contract';
import { ethers } from 'ethers';

// Demo data for when no wallet is connected
const DEMO_STAKE = {
  staked: 250,
  feeRate: 2.0,
  tier: 1,
  totalStaked: 125000,
  stakerCount: 84,
};

function getCurrentTier(stakedAmount) {
  for (let i = STAKING_TIERS.length - 1; i >= 0; i--) {
    if (stakedAmount >= STAKING_TIERS[i].minStake) return STAKING_TIERS[i];
  }
  return STAKING_TIERS[0];
}

function getNextTier(stakedAmount) {
  for (const tier of STAKING_TIERS) {
    if (stakedAmount < tier.minStake) return tier;
  }
  return null;
}

function TierCard({ tier, isCurrent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: tier.tier * 0.05 }}
      className={`bg-[#111113] rounded-lg p-4 border transition-colors duration-150 ${
        isCurrent
          ? 'border-[#10B981]'
          : 'border-[#27272A] hover:border-[#3F3F46]'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">
          {tier.label}
        </span>
        {isCurrent && (
          <span className="text-[10px] bg-[rgba(16,185,129,0.15)] text-[#10B981] px-2 py-0.5 rounded-full font-medium">
            Current
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#FAFAFA] tabular-nums tracking-tight">
        {tier.feeRate}%
      </p>
      <p className="text-xs text-[#71717A] mt-1">
        {tier.minStake === 0 ? 'Default rate' : `Stake ${tier.minStake}+ QIE`}
      </p>
    </motion.div>
  );
}

export default function Staking() {
  const [wallet, setWallet] = useState(null);
  const [staked, setStaked] = useState(0);
  const [feeRate, setFeeRate] = useState(2.5);
  const [totalStaked, setTotalStaked] = useState(0n);
  const [stakerCount, setStakerCount] = useState(0);
  const [stakeInput, setStakeInput] = useState('');
  const [unstakeInput, setUnstakeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const conn = await checkConnection();
      setWallet(conn);
      setIsDemo(conn.isDemo);

      if (conn.isDemo) {
        setStaked(DEMO_STAKE.staked);
        setFeeRate(DEMO_STAKE.feeRate);
        setTotalStaked(BigInt(DEMO_STAKE.totalStaked * 1e18));
        setStakerCount(DEMO_STAKE.stakerCount);
        return;
      }

      const [bal, rate, total, count] = await Promise.all([
        getStakeBalance(conn.address).catch(() => 0n),
        getFeeRate(conn.address).catch(() => 2.5),
        getTotalStaked().catch(() => 0n),
        getStakerCount().catch(() => 0),
      ]);

      setStaked(Number(ethers.formatEther(bal)));
      setFeeRate(typeof rate === 'number' ? rate : 2.5);
      setTotalStaked(total);
      setStakerCount(Number(count));
    } catch (err) {
      console.error('Failed to load staking data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentTier = getCurrentTier(staked);
  const nextTier = getNextTier(staked);
  const progress = nextTier
    ? ((staked - currentTier.minStake) / (nextTier.minStake - currentTier.minStake)) * 100
    : 100;
  const sharePercent = totalStaked > 0n
    ? ((staked / Number(ethers.formatEther(totalStaked))) * 100).toFixed(2)
    : '0.00';

  const handleStake = async () => {
    if (!stakeInput || isNaN(Number(stakeInput)) || Number(stakeInput) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (isDemo) {
      setStaked((prev) => prev + Number(stakeInput));
      toast.success(`Staked ${stakeInput} QIE (demo)`);
      setStakeInput('');
      return;
    }

    setLoading(true);
    try {
      const wei = ethers.parseEther(stakeInput);
      await stakeQIE(wei);
      toast.success(`Staked ${stakeInput} QIE`);
      setStakeInput('');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Staking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeInput || isNaN(Number(unstakeInput)) || Number(unstakeInput) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (Number(unstakeInput) > staked) {
      toast.error('Cannot unstake more than staked');
      return;
    }

    if (isDemo) {
      setStaked((prev) => prev - Number(unstakeInput));
      toast.success(`Unstaked ${unstakeInput} QIE (demo)`);
      setUnstakeInput('');
      return;
    }

    setLoading(true);
    try {
      const wei = ethers.parseEther(unstakeInput);
      await unstakeQIE(wei);
      toast.success(`Unstaked ${unstakeInput} QIE`);
      setUnstakeInput('');
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Unstaking failed');
    } finally {
      setLoading(false);
    }
  };

  // Update fee rate when staked amount changes (demo mode)
  useEffect(() => {
    if (isDemo) {
      const tier = getCurrentTier(staked);
      setFeeRate(tier.feeRate);
    }
  }, [staked, isDemo]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[#FAFAFA]">Stake & Save</h1>
        <p className="text-xs text-[#A1A1AA] mt-0.5">Stake QIE to reduce your payment fees</p>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAKING_TIERS.map((tier) => (
          <TierCard
            key={tier.tier}
            tier={tier}
            isCurrent={tier.tier === currentTier.tier}
          />
        ))}
      </div>

      {/* Your Stake */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-[#111113] border border-[#27272A] rounded-lg p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Coins size={18} className="text-[#10B981]" />
          <h2 className="text-sm font-semibold text-[#FAFAFA]">Your Stake</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-xs text-[#71717A] mb-1">Staked Amount</p>
            <p className="text-3xl font-bold text-[#FAFAFA] tabular-nums tracking-tight">
              {staked.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              <span className="text-sm font-normal text-[#A1A1AA] ml-1">QIE</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-[#71717A] mb-1">Current Fee Rate</p>
            <p className="text-3xl font-bold text-[#10B981] tabular-nums tracking-tight">
              {feeRate}%
            </p>
          </div>
          <div>
            <p className="text-xs text-[#71717A] mb-1">Tier</p>
            <p className="text-3xl font-bold text-[#FAFAFA] tabular-nums tracking-tight">
              {currentTier.label}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {nextTier && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-[#71717A] mb-2">
              <span>{currentTier.label} ({currentTier.feeRate}%)</span>
              <span>{nextTier.label} ({nextTier.feeRate}%)</span>
            </div>
            <div className="w-full h-2 bg-[#1E1E21] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(Math.max(progress, 2), 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#52525B] mt-1.5">
              {(nextTier.minStake - staked).toFixed(0)} QIE to next tier
            </p>
          </div>
        )}

        {/* Stake / Unstake inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#71717A] mb-1.5 block">Stake More</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={stakeInput}
                onChange={(e) => setStakeInput(e.target.value)}
                placeholder="Amount in QIE"
                min="0"
                step="any"
                className="flex-1 bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors tabular-nums"
              />
              <button
                onClick={handleStake}
                disabled={loading}
                className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-md transition-colors duration-150 disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? '...' : 'Stake'}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#71717A] mb-1.5 block">Unstake</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={unstakeInput}
                onChange={(e) => setUnstakeInput(e.target.value)}
                placeholder="Amount in QIE"
                min="0"
                step="any"
                className="flex-1 bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#3F3F46] transition-colors tabular-nums"
              />
              <button
                onClick={handleUnstake}
                disabled={loading}
                className="px-4 py-2 border border-[#27272A] hover:border-[#3F3F46] text-[#A1A1AA] text-sm font-medium rounded-md transition-colors duration-150 disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? '...' : 'Unstake'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Protocol Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="bg-[#111113] border border-[#27272A] rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-[#10B981]" />
            <p className="text-xs text-[#71717A]">Total Staked</p>
          </div>
          <p className="text-xl font-bold text-[#FAFAFA] tabular-nums tracking-tight">
            {Number(ethers.formatEther(totalStaked)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-xs font-normal text-[#A1A1AA] ml-1">QIE</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: 0.05 }}
          className="bg-[#111113] border border-[#27272A] rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-[#10B981]" />
            <p className="text-xs text-[#71717A]">Stakers</p>
          </div>
          <p className="text-xl font-bold text-[#FAFAFA] tabular-nums tracking-tight">
            {stakerCount.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: 0.1 }}
          className="bg-[#111113] border border-[#27272A] rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={14} className="text-[#10B981]" />
            <p className="text-xs text-[#71717A]">Your Share</p>
          </div>
          <p className="text-xl font-bold text-[#FAFAFA] tabular-nums tracking-tight">
            {sharePercent}
            <span className="text-xs font-normal text-[#A1A1AA] ml-0.5">%</span>
          </p>
        </motion.div>
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#111113] border border-[#27272A]">
          <Info size={14} className="text-[#71717A] shrink-0" />
          <p className="text-xs text-[#71717A]">
            Demo mode — connect a wallet to interact with the staking contract
          </p>
        </div>
      )}
    </div>
  );
}
