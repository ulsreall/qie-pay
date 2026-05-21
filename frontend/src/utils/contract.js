import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, QIEPAY_ABI, CHAIN_ID, CHAIN_ID_HEX, CHAIN_NAME, RPC_URL } from './constants';

// Get provider (read-only)
export function getProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return new ethers.JsonRpcProvider(RPC_URL);
}

// Get signer (requires wallet)
export async function getSigner() {
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

  // Try direct approach for QIE Wallet compatibility
  if (window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Encode function call manually
      const iface = new ethers.Interface(QIEPAY_ABI);
      const data = iface.encodeFunctionData('createPayment', [description, orderId, amountWei]);

      console.log('Creating payment from:', address);
      console.log('Amount:', amountInQIE, 'QIE =', amountWei.toString(), 'wei');
      console.log('Encoded data:', data);

      // Send raw transaction via wallet
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: CONTRACT_ADDRESS,
          data: data,
        }],
      });

      console.log('TX hash:', txHash);

      // Wait for receipt
      const receipt = await provider.waitForTransaction(txHash);
      console.log('Receipt:', receipt);

      // Parse event
      const contract = new ethers.Contract(CONTRACT_ADDRESS, QIEPAY_ABI, provider);
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
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
    } catch (err) {
      console.error('Create payment error:', err);
      throw err;
    }
  }

  // Fallback to ethers.js
  const contract = await getContract();
  const tx = await contract.createPayment(description, orderId, amountWei);
  const receipt = await tx.wait();

  const event = receipt.logs.find((log) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed.name === 'PaymentCreated';
    } catch {
      return false;
    }
  });

  if (event) {
    const parsed = contract.interface.parseLog(event);
    return {
      paymentId: parsed.args.paymentId.toString(),
      receipt,
    };
  }

  return { paymentId: null, receipt };
}

// Pay for a payment
// Pay for a payment
export async function payForPayment(paymentId, amountInQIE) {
  const value = ethers.parseEther(amountInQIE.toString());

  // Direct approach for QIE Wallet compatibility
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    const iface = new ethers.Interface(QIEPAY_ABI);
    const data = iface.encodeFunctionData('pay', [BigInt(paymentId)]);

    console.log('Paying payment:', paymentId);
    console.log('Amount:', amountInQIE, 'QIE =', value.toString(), 'wei');

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: address,
        to: CONTRACT_ADDRESS,
        data: data,
        value: '0x' + value.toString(16),
      }],
    });

    console.log('TX hash:', txHash);
    return await provider.waitForTransaction(txHash);
  }

  // Fallback
  const contract = await getContract();
  const tx = await contract.pay(paymentId, { value });
  return tx.wait();
}

// Settle payment (merchant)
export async function settlePayment(paymentId) {
  const contract = await getContract();
  const tx = await contract.settlePayment(paymentId);
  return tx.wait();
}

// Refund payment
export async function refundPayment(paymentId) {
  const contract = await getContract();
  const tx = await contract.refundPayment(paymentId);
  return tx.wait();
}

// Cancel payment
export async function cancelPayment(paymentId) {
  const contract = await getContract();
  const tx = await contract.cancelPayment(paymentId);
  return tx.wait();
}

// Get payment details
export async function getPayment(paymentId) {
  const contract = getReadContract();
  const payment = await contract.getPayment(paymentId);
  return formatPayment(payment);
}

// Get merchant payments
export async function getMerchantPayments(merchantAddress) {
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
  const contract = getReadContract();
  const earnings = await contract.getMerchantEarnings(merchantAddress);
  return ethers.formatEther(earnings);
}

// Check if address is registered merchant
export async function isMerchant(address) {
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
export async function checkConnection() {
  if (!window.ethereum) return null;

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    if (accounts.length === 0) return null;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(accounts[0]);

    return {
      address: accounts[0],
      balance: ethers.formatEther(balance),
    };
  } catch {
    return null;
  }
}
