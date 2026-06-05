// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QIEStaking
 * @notice Merchant staking for QIEPay fee tier discounts
 * @dev SECURITY: ReentrancyGuard, events on all state changes,
 *      owner cannot set arbitrary tiers (validation).
 */
contract QIEStaking {
    // ─── Reentrancy Guard ─────────────────────────────────────
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status = NOT_ENTERED;

    modifier nonReentrant() {
        require(_status != ENTERED, "QIEStaking: reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }

    address public owner;
    address public qiePayContract;

    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastRewardAt;
    }

    // Fee tiers: stake amount → fee basis points
    uint256[] public tierAmounts;   // [0, 100e18, 500e18, 1000e18]
    uint256[] public tierFees;      // [250, 200, 150, 100]

    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    uint256 public stakerCount;

    event Staked(address indexed merchant, uint256 amount, uint256 newTotal);
    event Unstaked(address indexed merchant, uint256 amount, uint256 remaining);
    event RewardClaimed(address indexed merchant, uint256 amount);
    event TierUpdated(uint256 indexed index, uint256 amount, uint256 fee);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "QIEStaking: not owner");
        _;
    }

    constructor(address _qiePayContract) {
        owner = msg.sender;
        qiePayContract = _qiePayContract;

        // Initialize tiers
        tierAmounts = [0, 100 ether, 500 ether, 1000 ether];
        tierFees = [250, 200, 150, 100]; // basis points
    }

    /**
     * @notice Stake QIE for fee discount
     */
    function stake() external payable nonReentrant {
        require(msg.value > 0, "QIEStaking: must stake > 0");

        StakeInfo storage s = stakes[msg.sender];
        bool isNew = (s.amount == 0);

        s.amount += msg.value;
        s.stakedAt = block.timestamp;
        totalStaked += msg.value;
        if (isNew) stakerCount++;

        emit Staked(msg.sender, msg.value, s.amount);
    }

    /**
     * @notice Unstake QIE
     */
    function unstake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "QIEStaking: zero amount");

        StakeInfo storage s = stakes[msg.sender];
        require(s.amount >= _amount, "QIEStaking: insufficient stake");

        // Effects BEFORE interactions
        s.amount -= _amount;
        totalStaked -= _amount;
        if (s.amount == 0) stakerCount--;

        emit Unstaked(msg.sender, _amount, s.amount);

        // Interaction
        (bool ok, ) = payable(msg.sender).call{value: _amount}("");
        require(ok, "QIEStaking: transfer failed");
    }

    function getStake(address _merchant) external view returns (uint256) {
        return stakes[_merchant].amount;
    }

    function getFeeRate(address _merchant) external view returns (uint256) {
        uint256 staked = stakes[_merchant].amount;
        uint256 fee = tierFees[0]; // default 2.5%
        for (uint i = tierAmounts.length - 1; i > 0; i--) {
            if (staked >= tierAmounts[i]) {
                fee = tierFees[i];
                break;
            }
        }
        return fee;
    }

    function getTierInfo(address _merchant) external view returns (
        uint256 currentTier,
        uint256 currentFee,
        uint256 nextTierAmount,
        uint256 nextTierFee,
        uint256 staked
    ) {
        staked = stakes[_merchant].amount;
        currentFee = tierFees[0];
        currentTier = 0;
        nextTierAmount = tierAmounts[1];
        nextTierFee = tierFees[1];

        for (uint i = tierAmounts.length - 1; i > 0; i--) {
            if (staked >= tierAmounts[i]) {
                currentTier = i;
                currentFee = tierFees[i];
                if (i < tierAmounts.length - 1) {
                    nextTierAmount = tierAmounts[i + 1];
                    nextTierFee = tierFees[i + 1];
                } else {
                    nextTierAmount = 0;
                    nextTierFee = currentFee;
                }
                break;
            }
        }
    }

    function getAllStakers() external pure returns (address[] memory) {
        return new address[](0);
    }

    /**
     * @notice Update a fee tier
     * @dev SECURITY: Validates fee is within bounds (100-500 bps = 1%-5%)
     */
    function setTier(uint256 _index, uint256 _amount, uint256 _fee) external onlyOwner {
        require(_index < tierAmounts.length, "QIEStaking: invalid index");
        require(_fee >= 100 && _fee <= 500, "QIEStaking: fee must be 1%-5%");

        tierAmounts[_index] = _amount;
        tierFees[_index] = _fee;

        emit TierUpdated(_index, _amount, _fee);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "QIEStaking: zero address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    receive() external payable nonReentrant {
        require(msg.value > 0, "QIEStaking: must stake > 0");

        StakeInfo storage s = stakes[msg.sender];
        bool isNew = (s.amount == 0);

        s.amount += msg.value;
        s.stakedAt = block.timestamp;
        totalStaked += msg.value;
        if (isNew) stakerCount++;

        emit Staked(msg.sender, msg.value, s.amount);
    }
}
