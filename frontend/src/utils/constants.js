// Contract configuration for QIEPay on QIE Testnet
export const CHAIN_ID = 1983;
export const CHAIN_ID_HEX = '0x7BF';
export const CHAIN_NAME = 'QIE Testnet';
export const RPC_URL = 'https://rpc1testnet.qie.digital/';
export const BLOCK_EXPLORER = 'https://explorer.qie.io';
export const EXPLORER_URL = 'https://explorer.qie.io';

// Contract address - update after deployment
export const CONTRACT_ADDRESS = '0xFFC670DA0f40c1602175415abd9CEcd6d6BADD42';

export const QIEPAY_ABI = [
  // Events
  'event MerchantRegistered(address indexed merchant, uint256 timestamp)',
  'event PaymentCreated(uint256 indexed paymentId, address indexed merchant, uint256 amount, string description, string orderId)',
  'event PaymentPaid(uint256 indexed paymentId, address indexed customer, uint256 amount)',
  'event PaymentSettled(uint256 indexed paymentId, address indexed merchant, uint256 amount, uint256 fee)',
  'event PaymentRefunded(uint256 indexed paymentId, address indexed customer, uint256 amount)',
  'event PaymentCancelled(uint256 indexed paymentId)',
  'event FeeUpdated(uint256 oldFee, uint256 newFee)',

  // Write functions
  'function registerMerchant() external',
  'function createPayment(string calldata _description, string calldata _orderId, uint256 _amountInQIE) external returns (uint256 paymentId)',
  'function pay(uint256 _paymentId) external payable',
  'function settlePayment(uint256 _paymentId) external',
  'function refundPayment(uint256 _paymentId) external',
  'function cancelPayment(uint256 _paymentId) external',
  'function setFeePercent(uint256 _newFee) external',
  'function setFeeRecipient(address _newRecipient) external',
  'function transferOwnership(address _newOwner) external',

  // View functions
  'function owner() external view returns (address)',
  'function paymentCounter() external view returns (uint256)',
  'function feePercent() external view returns (uint256)',
  'function feeRecipient() external view returns (address)',
  'function merchants(address) external view returns (bool)',
  'function merchantEarnings(address) external view returns (uint256)',
  'function merchantPayments(address) external view returns (uint256[])',
  'function payments(uint256) external view returns (uint256 id, address merchant, address customer, uint256 amount, uint256 fee, uint256 createdAt, uint256 settledAt, string description, string orderId, uint8 status)',
  'function getPayment(uint256 _paymentId) external view returns (tuple(uint256 id, address merchant, address customer, uint256 amount, uint256 fee, uint256 createdAt, uint256 settledAt, string description, string orderId, uint8 status))',
  'function getMerchantPayments(address _merchant) external view returns (uint256[])',
  'function getMerchantEarnings(address _merchant) external view returns (uint256)',
];

// Alias for convenience
export const ABI = QIEPAY_ABI;

export const STATUS_MAP = {
  0: 'Created',
  1: 'Paid',
  2: 'Settled',
  3: 'Refunded',
  4: 'Cancelled',
};

export const STATUS_COLORS = {
  0: 'text-sky-400 bg-sky-400/10',
  1: 'text-amber-400 bg-amber-400/10',
  2: 'text-[#34D399] bg-[#34D399]/10',
  3: 'text-blue-400 bg-blue-400/10',
  4: 'text-red-400 bg-red-400/10',
};
