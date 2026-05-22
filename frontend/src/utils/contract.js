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

// Get email wallet from localStorage
function getEmailWallet() {
  try {
    const saved = localStorage.getItem(EMAIL_WALLET_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return null;
}

// Get provider (read-only)
export function getProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return new ethers.JsonRpcProvider(RPC_URL);
}

// Get signer (requires wallet)
export async function getSigner() {
  // Check for email wallet first
  const emailWallet = getEmailWallet();
  if (emailWallet && emailWallet.privateKey) {
    return new ethers.Wallet(emailWallet.privateKey, getProvider());
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

// Get contract with provider (for reads)
export function getReadContract() {
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, QIEPAY_ABI, provider);
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
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

// Register as merchant
export async function registerMerchant() {
  const contract = await getContract();
  const tx = await contract.registerMerchant();
  return tx.wait();
}

// Create payment
export async function createPayment(description, orderId, amountInQIE) {
  const amountWei = ethers.parseEther(amountInQIE.toString());

  // getContract() uses getSigner() which checks email wallet first,
  // then falls back to browser extension (window.ethereum)
  const contract = await getContract();
  const tx = await contract.createPayment(description, orderId, amountWei);
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
  const tx = await contract.pay(paymentId, { value });
  return tx.wait();
}

// Helper: send contract transaction (email wallet aware)
async function sendContractTx(functionName, args = [], txOverrides = {}) {
  const contract = await getContract();
  const tx = await contract[functionName](...args, txOverrides);
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
export async function getPayment(paymentId) {
  // Check demo payments first
  const demoPayment = DEMO_PAYMENTS.find((p) => p.id === paymentId || p.id === String(paymentId));
  if (demoPayment) return { ...demoPayment };

  const contract = getReadContract();
  const payment = await contract.getPayment(paymentId);
  return formatPayment(payment);
}

// Get merchant payments
export async function getMerchantPayments(merchantAddress) {
  // If requesting demo address payments, return demo data
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
  }
}

// Check if wallet is connected
// Returns real wallet data if available, otherwise returns demo data for demo mode
export async function checkConnection() {
  // Check for email wallet first
  const emailWallet = getEmailWallet();
  if (emailWallet && emailWallet.address) {
    try {
      const provider = getProvider();
      const balance = await provider.getBalance(emailWallet.address);
      return {
        address: emailWallet.address,
        balance: ethers.formatEther(balance),
        email: emailWallet.email,
        isEmailWallet: true,
        isDemo: false,
      };
    } catch {
      // If balance fetch fails, return email wallet with 0 balance
      return {
        address: emailWallet.address,
        balance: '0',
        email: emailWallet.email,
        isEmailWallet: true,
        isDemo: false,
      };
    }
  }

  if (!window.ethereum) {
    // No wallet provider → enter demo mode
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
      // Wallet installed but no account connected → demo mode
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
