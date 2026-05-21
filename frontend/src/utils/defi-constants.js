// DeFi Contract Addresses (deployed to QIE Testnet)
export const STAKING_ADDRESS = '0x98D953BE697C730Ebc94e5d5032f68503f7140fC';
export const GOVERNANCE_ADDRESS = '0xDBdDb269CcBd0EcE141c14E9eCaF695f2b1f4d74';
export const REWARDS_ADDRESS = '0x56A140D3700aad23461605a3Cf7b9E880DfaECa4';

// QIEStaking ABI (human-readable)
export const STAKING_ABI = [
  'function stake() payable',
  'function unstake(uint256 amount)',
  'function getStake(address staker) view returns (uint256)',
  'function getFeeRate(address staker) view returns (uint256)',
  'function getTierInfo(address staker) view returns (uint8 tier, uint256 staked, uint256 nextTierAt, uint256 feeRate)',
  'function totalStaked() view returns (uint256)',
  'function stakerCount() view returns (uint256)',
  'event Staked(address indexed staker, uint256 amount)',
  'event Unstaked(address indexed staker, uint256 amount)',
];

// QIEGovernance ABI (human-readable)
export const GOVERNANCE_ABI = [
  'function createProposal(string title, string description)',
  'function vote(uint256 proposalId, bool support)',
  'function executeProposal(uint256 proposalId)',
  'function cancelProposal(uint256 proposalId)',
  'function getProposal(uint256 proposalId) view returns (uint256 id, string title, string description, address proposer, uint256 forVotes, uint256 againstVotes, uint256 startTime, uint256 endTime, bool executed, bool cancelled)',
  'function getProposalStatus(uint256 proposalId) view returns (uint8)',
  'function proposalCounter() view returns (uint256)',
  'function votingDuration() view returns (uint256)',
  'function quorum() view returns (uint256)',
  'event ProposalCreated(uint256 indexed proposalId, string title, address proposer)',
  'event Voted(uint256 indexed proposalId, address voter, bool support, uint256 weight)',
  'event ProposalExecuted(uint256 indexed proposalId)',
];

// QIERewards (ERC-20 + utilities) ABI (human-readable)
export const REWARDS_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function mintRewards(address customer, uint256 paymentId)',
  'function burnForDiscount()',
  'function getDiscountInfo(address account) view returns (uint256 discountPercent, uint256 expiresAt, bool hasDiscount)',
  'function mint(address to, uint256 amount)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event RewardsMinted(address indexed customer, uint256 amount, uint256 paymentId)',
  'event DiscountActivated(address indexed account, uint256 discountPercent, uint256 expiresAt)',
];

// Staking tiers configuration
export const STAKING_TIERS = [
  { tier: 0, minStake: 0, feeRate: 2.5, label: 'Default' },
  { tier: 1, minStake: 100, feeRate: 2.0, label: 'Bronze' },
  { tier: 2, minStake: 500, feeRate: 1.5, label: 'Silver' },
  { tier: 3, minStake: 1000, feeRate: 1.0, label: 'Gold' },
];

// Rewards constants
export const QIEP_PER_PAYMENT = 1;
export const BURN_COST = 10;
export const DISCOUNT_PERCENT = 10;
