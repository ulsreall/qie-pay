import { ethers } from 'ethers';
import {
  STAKING_ADDRESS,
  GOVERNANCE_ADDRESS,
  REWARDS_ADDRESS,
  STAKING_ABI,
  GOVERNANCE_ABI,
  REWARDS_ABI,
} from './defi-constants';
import { RPC_URL } from './constants';

// ─── Shared helpers (email wallet + browser wallet) ───

const EMAIL_WALLET_KEY = 'qiepay_email_wallet';

function getEmailWallet() {
  try {
    const saved = localStorage.getItem(EMAIL_WALLET_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function getDirectProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

function getProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return getDirectProvider();
}

async function getSigner() {
  // Check email wallet first
  const emailWallet = getEmailWallet();
  if (emailWallet && emailWallet.privateKey) {
    return new ethers.Wallet(emailWallet.privateKey, getDirectProvider());
  }
  // Fall back to browser extension
  if (typeof window !== 'undefined' && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider.getSigner();
  }
  throw new Error('No wallet connected. Please connect a wallet or login with email.');
}

async function getSignerAddress() {
  const signer = await getSigner();
  return signer.getAddress();
}

async function sendTx(abi, address, functionName, args = [], txOverrides = {}) {
  const signer = await getSigner();
  const contract = new ethers.Contract(address, abi, signer);
  const tx = await contract[functionName](...args, { gasLimit: 300000, ...txOverrides });
  return tx.wait();
}

async function readCall(abi, address, functionName, args = []) {
  const provider = getDirectProvider();
  const contract = new ethers.Contract(address, abi, provider);
  return contract[functionName](...args);
}

async function sendTxRaw(to, data) {
  const signer = await getSigner();
  const tx = await signer.sendTransaction({ to, data, gasLimit: 300000 });
  return tx.wait();
}

// ─── Staking ───

export async function stakeQIE(amountWei) {
  return sendTx(STAKING_ABI, STAKING_ADDRESS, 'stake', [], {
    value: BigInt(amountWei),
  });
}

export async function unstakeQIE(amountWei) {
  return sendTx(STAKING_ABI, STAKING_ADDRESS, 'unstake', [BigInt(amountWei)]);
}

export async function getStakeBalance(address) {
  const result = await readCall(STAKING_ABI, STAKING_ADDRESS, 'getStake', [address]);
  return result;
}

export async function getFeeRate(address) {
  const result = await readCall(STAKING_ABI, STAKING_ADDRESS, 'getFeeRate', [address]);
  return Number(result) / 100; // basis points to percentage
}

export async function getTierInfo(address) {
  const result = await readCall(STAKING_ABI, STAKING_ADDRESS, 'getTierInfo', [address]);
  return {
    tier: Number(result.tier ?? result[0]),
    staked: result.staked ?? result[1],
    nextTierAt: result.nextTierAt ?? result[2],
    feeRate: Number(result.feeRate ?? result[3]) / 100,
  };
}

export async function getTotalStaked() {
  return readCall(STAKING_ABI, STAKING_ADDRESS, 'totalStaked');
}

export async function getStakerCount() {
  return readCall(STAKING_ABI, STAKING_ADDRESS, 'stakerCount');
}

// ─── Governance ───

export async function createProposal(title, description) {
  return sendTx(GOVERNANCE_ABI, GOVERNANCE_ADDRESS, 'createProposal', [title, description]);
}

export async function voteProposal(proposalId, support) {
  return sendTx(GOVERNANCE_ABI, GOVERNANCE_ADDRESS, 'vote', [BigInt(proposalId), support]);
}

export async function executeProposal(proposalId) {
  return sendTx(GOVERNANCE_ABI, GOVERNANCE_ADDRESS, 'executeProposal', [BigInt(proposalId)]);
}

export async function cancelProposal(proposalId) {
  return sendTx(GOVERNANCE_ABI, GOVERNANCE_ADDRESS, 'cancelProposal', [BigInt(proposalId)]);
}

export async function getProposal(id) {
  const result = await readCall(GOVERNANCE_ABI, GOVERNANCE_ADDRESS, 'getProposal', [BigInt(id)]);
  return {
    id: Number(result.id ?? result[0]),
    title: result.title ?? result[1],
    description: result.description ?? result[2],
    proposer: result.proposer ?? result[3],
    forVotes: result.forVotes ?? result[4],
    againstVotes: result.againstVotes ?? result[5],
    startTime: Number(result.startTime ?? result[6]),
    endTime: Number(result.endTime ?? result[7]),
    executed: result.executed ?? result[8],
    cancelled: result.cancelled ?? result[9],
  };
}

export async function getProposalCount() {
  const result = await readCall(GOVERNANCE_ABI, GOVERNANCE_ADDRESS, 'proposalCounter');
  return Number(result);
}

export async function getProposalStatus(id) {
  const result = await readCall(GOVERNANCE_ABI, GOVERNANCE_ADDRESS, 'getProposalStatus', [BigInt(id)]);
  return Number(result);
}

// ─── Rewards (QIEP Token) ───

export async function getQIEPBalance(address) {
  const result = await readCall(REWARDS_ABI, REWARDS_ADDRESS, 'balanceOf', [address]);
  return result;
}

export async function transferQIEP(to, amount) {
  return sendTx(REWARDS_ABI, REWARDS_ADDRESS, 'transfer', [to, BigInt(amount)]);
}

export async function burnQIEPForDiscount() {
  return sendTx(REWARDS_ABI, REWARDS_ADDRESS, 'burnForDiscount', []);
}

export async function mintRewards(customer, paymentId) {
  const signer = await getSigner();
  const contract = new ethers.Contract(REWARDS_ADDRESS, REWARDS_ABI, signer);
  const tx = await contract.mintRewards(customer, BigInt(paymentId), { gasLimit: 300000 });
  return tx.wait();
}

export async function getDiscountInfo(address) {
  const result = await readCall(REWARDS_ABI, REWARDS_ADDRESS, 'getDiscountInfo', [address]);
  return {
    discountPercent: Number(result.discountPercent ?? result[0]),
    expiresAt: Number(result.expiresAt ?? result[1]),
    hasDiscount: result.hasDiscount ?? result[2],
  };
}

export async function addQIEPToWallet() {
  if (!window.ethereum) throw new Error('Browser wallet required to add token to wallet');
  return window.ethereum.request({
    method: 'wallet_watchAsset',
    params: {
      type: 'ERC20',
      options: {
        address: REWARDS_ADDRESS,
        symbol: 'QIEP',
        decimals: 18,
        image: '',
      },
    },
  });
}
