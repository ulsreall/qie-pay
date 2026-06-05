import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, QIEPAY_ABI, CHAIN_ID, CHAIN_ID_HEX, CHAIN_NAME, RPC_URL } from './constants';
import {
  DEMO_ADDRESS,
  DEMO_PAYMENTS,
  DEMO_EARNINGS,
  DEMO_BALANCE,
} from './demoData';

// Email wallet storage key
const EMAIL_WALLET_KEY = 'qiepay_email_wallet';

// Module-level cache for decrypted private key (never in localStorage)
let _cachedPrivateKey = null;
let _cachedAddress = null;

/**
 * Set cached private key (called by EmailWalletProvider after decryption)
 * This allows contract.js to use the key without re-reading localStorage
 */
export function setCachedEmailWallet(privateKey, address) {
  _cachedPrivateKey = privateKey;
  _cachedAddress = address;
}

/**
 * Clear cached private key (called on disconnect)
 */
export function clearCachedEmailWallet() {
  _cachedPrivateKey = null;
  _cachedAddress = null;
}

/**
 * Get email wallet info (address only, no private key exposure)
 */
function getEmailWalletInfo() {
  try {
    const saved = localStorage.getItem(EMAIL_WALLET_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return { address: data.address, email: data.email, encrypted: data.encrypted };
    }
  } catch {}
  return null;
}

// Get provider (read-only)
function getDirectProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return new ethers.JsonRpcProvider(RPC_URL);
}

// Get signer (requires wallet)
export async function getSigner() {
  // Check for email wallet first — uses cached private key
  const walletInfo = getEmailWalletInfo();
  if (walletInfo && _cachedPrivateKey) {
    return new ethers.Wallet(_cachedPrivateKey, getDirectProvider());
  }

  if (!window.ethereum) {
    throw new Error('Wallet not found. Please install QIE Wallet or MetaMask.');
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
}

// Get contract with signer (for writes)
export async function getContract() {
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, QIEPAY_ABI, signer);
}

// Get contract with provider (for reads) — always use direct RPC
export function getReadContract() {
  return new ethers.Contract(CONTRACT_ADDRESS, QIEPAY_ABI, getDirectProvider());
}

// Connect wallet
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('Wallet not found. Please install QIE Wallet or MetaMask.');
  }

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  // Try to switch to QIE network
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (switchError) {
    // Chain not added, try to add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: CHAIN_ID_HEX,
              chainName: CHAIN_NAME,
              rpcUrls: [RPC_URL],
              nativeCurrency: {
                name: 'QIE',
                symbol: 'QIE',
                decimals: 18,
              },
            },
          ],
        });
      } catch (addError) {
        console.error('Failed to add QIE network:', addError);
      }
    }
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const balance = await provider.getBalance(address);

  return {
    address,
    balance: ethers.formatEther(balance),
    provider,
    signer,
  };
}

// Get wallet balance
export async function getBalance(address) {
  const provider = getProvider();
  const [balance, network] = await Promise.all([
    provider.getBalance(address),
    provider.getNetwork(),
  ]);
  return {
    balance: ethers.formatEther(balance),
    chainId: Number(network.chainId),
  };
}

// Register as merchant
export async function registerMerchant() {
  const contract = await getContract();
  const tx = await contract.registerMerchant({ gasLimit: 200000 });
  return tx.wait();
}

// Create payment
export async function createPayment(description, orderId, amountInQIE) {
  const amountWei = ethers.parseEther(amountInQIE.toString());

  const contract = await getContract();
  const tx = await contract.createPayment(description, orderId, amountWei, { gasLimit: 500000 });
  const receipt = await tx.wait();

  const contract2 = new ethers.Contract(CONTRACT_ADDRESS, QIEPAY_ABI, getProvider());
  for (const log of receipt.logs) {
    try {
      const parsed = contract2.interface.parseLog(log);
      if (parsed && parsed.name === 'PaymentCreated') {
        return {
          paymentId: parsed.args.paymentId.toString(),
          receipt,
        };
      }
    } catch {
      continue;
    }
  }

  return { paymentId: null, receipt };
}

// Pay for a payment
export async function payForPayment(paymentId, amountInQIE) {
  const value = ethers.parseEther(amountInQIE.toString());
  const contract = await getContract();
  const tx = await contract.pay(paymentId, { value, gasLimit: 300000 });
  return tx.wait();
}

// Helper: send contract transaction (email wallet aware)
async function sendContractTx(functionName, args = [], txOverrides = {}) {
  const contract = await getContract();
  const tx = await contract[functionName](...args, { gasLimit: 300000, ...txOverrides });
  return tx.wait();
}

// Settle payment (merchant)
export async function settlePayment(paymentId) {
  return sendContractTx('settlePayment', [BigInt(paymentId)]);
}

// Refund payment
export async function refundPayment(paymentId) {
  return sendContractTx('refundPayment', [BigInt(paymentId)]);
}

// Cancel payment
export async function cancelPayment(paymentId) {
  return sendContractTx('cancelPayment', [BigInt(paymentId)]);
}

// Get payment details
export async function getPayment(paymentId, { isDemoMode = false } = {}) {
  if (isDemoMode) {
    const demoPayment = DEMO_PAYMENTS.find((p) => p.id === paymentId || p.id === String(paymentId));
    if (demoPayment) return { ...demoPayment };
  }

  const contract = getReadContract();
  const payment = await contract.getPayment(paymentId);
  return formatPayment(payment);
}

// Get merchant payments
export async function getMerchantPayments(merchantAddress) {
  if (merchantAddress === DEMO_ADDRESS) {
    return [...DEMO_PAYMENTS];
  }

  const contract = getReadContract();
  const paymentIds = await contract.getMerchantPayments(merchantAddress);

  const payments = await Promise.all(
    paymentIds.map(async (id) => {
      try {
        return await getPayment(id.toString());
      } catch {
        return null;
      }
    })
  );

  return payments.filter(Boolean);
}

// Get merchant earnings
export async function getMerchantEarnings(merchantAddress) {
  if (merchantAddress === DEMO_ADDRESS) {
    return DEMO_EARNINGS;
  }

  const contract = getReadContract();
  const earnings = await contract.getMerchantEarnings(merchantAddress);
  return ethers.formatEther(earnings);
}

// Check if address is registered merchant
export async function isMerchant(address) {
  if (address === DEMO_ADDRESS) {
    return true;
  }

  const contract = getReadContract();
  return contract.merchants(address);
}

// Check if merchant is registered, register if not
export async function ensureMerchant() {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const registered = await isMerchant(address);

  if (!registered) {
    const receipt = await registerMerchant();
    return { registered: true, isNew: true, receipt };
  }

  return { registered: true, isNew: false };
}

// Format payment struct from contract
function formatPayment(payment) {
  return {
    id: payment.id.toString(),
    merchant: payment.merchant,
    customer: payment.customer,
    amount: ethers.formatEther(payment.amount),
    fee: ethers.formatEther(payment.fee),
    createdAt: Number(payment.createdAt),
    settledAt: Number(payment.settledAt),
    description: payment.description,
    orderId: payment.orderId,
    status: Number(payment.status),
  };
}

// Listen for account changes
export function onAccountChange(callback) {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
    window.ethereum.on('chainChanged', () => window.location.reload());
    return () => {
      window.ethereum.removeListener('accountsChanged', callback);
    };
  }
  return () => {};
}

// Check if wallet is connected
export async function checkConnection() {
  // Check for email wallet first
  const walletInfo = getEmailWalletInfo();
  if (walletInfo && walletInfo.address) {
    const result = {
      address: walletInfo.address,
      balance: '0',
      email: walletInfo.email,
      isEmailWallet: true,
      isDemo: false,
    };
    // Try to fetch balance (non-blocking, best-effort)
    try {
      const provider = getDirectProvider();
      const balance = await provider.getBalance(walletInfo.address);
      result.balance = ethers.formatEther(balance);
    } catch {
      // Balance fetch failed — still return the wallet with 0 balance
    }
    return result;
  }

  if (!window.ethereum) {
    return {
      address: DEMO_ADDRESS,
      balance: DEMO_BALANCE,
      isDemo: true,
    };
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    if (accounts.length === 0) {
      return {
        address: DEMO_ADDRESS,
        balance: DEMO_BALANCE,
        isDemo: true,
      };
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(accounts[0]);

    return {
      address: accounts[0],
      balance: ethers.formatEther(balance),
      isDemo: false,
    };
  } catch {
    return {
      address: DEMO_ADDRESS,
      balance: DEMO_BALANCE,
      isDemo: true,
    };
  }
}
