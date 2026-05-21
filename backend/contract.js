const { ethers } = require('ethers');
const config = require('./config');
const abi = require('./abi.json');

// ─── Provider ─────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(config.rpcUrl, {
  chainId: config.chainId,
  name: 'qie-testnet',
});

// ─── Signer (backend wallet for write operations) ─────────────
let signer = null;
if (config.privateKey) {
  signer = new ethers.Wallet(config.privateKey, provider);
}

// ─── Contract instances ───────────────────────────────────────
// Read-only contract (uses provider, no gas needed for view calls)
const contractAddress = config.contractAddress;
let contractRead = null;
let contractWrite = null;

if (contractAddress && ethers.isAddress(contractAddress)) {
  contractRead = new ethers.Contract(contractAddress, abi, provider);
  contractWrite = signer
    ? new ethers.Contract(contractAddress, abi, signer)
    : null;
} else {
  console.warn('⚠️  Contract instances not created (CONTRACT_ADDRESS missing or invalid)');
}

// ─── Helper: get contract connected to any address ────────────
function getContractForAddress(address) {
  const wallet = new ethers.Wallet(address, provider);
  return new ethers.Contract(config.contractAddress, abi, wallet);
}

// ─── Helper: format payment struct from contract ──────────────
function formatPayment(payment) {
  const statusNames = ['Created', 'Paid', 'Settled', 'Refunded', 'Cancelled'];
  return {
    id: Number(payment.id),
    merchant: payment.merchant,
    customer: payment.customer,
    amount: ethers.formatEther(payment.amount),
    amountWei: payment.amount.toString(),
    fee: ethers.formatEther(payment.fee),
    feeWei: payment.fee.toString(),
    createdAt: Number(payment.createdAt),
    settledAt: Number(payment.settledAt),
    description: payment.description,
    orderId: payment.orderId,
    status: statusNames[Number(payment.status)] || 'Unknown',
    statusCode: Number(payment.status),
  };
}

// ─── Helper: extract revert reason ────────────────────────────
function parseContractError(error) {
  if (error.reason) return error.reason;
  if (error.data?.message) return error.data.message;
  if (error.message) {
    const match = error.message.match(/reason="([^"]+)"/);
    if (match) return match[1];
    // Revert string
    const revert = error.message.match(/reverted with reason string '([^']+)'/);
    if (revert) return revert[1];
  }
  return 'Transaction failed';
}

module.exports = {
  provider,
  signer,
  contractRead,
  contractWrite,
  getContractForAddress,
  formatPayment,
  parseContractError,
  abi,
};
