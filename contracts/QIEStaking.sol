// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract QIEStaking {
    address public owner;
    address public qiePayContract; // Reference to main QIEPay contract
    
    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastRewardAt;
    }
    
    // Fee tiers: stake amount → fee basis points
    // 0 QIE = 250 (2.5%), 100 QIE = 200 (2.0%), 500 QIE = 150 (1.5%), 1000 QIE = 100 (1.0%)
    uint256[] public tierAmounts;   // [0, 100e18, 500e18, 1000e18]
    uint256[] public tierFees;      // [250, 200, 150, 100]
    
    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    uint256 public stakerCount;
    
    event Staked(address indexed merchant, uint256 amount, uint256 newTotal);
    event Unstaked(address indexed merchant, uint256 amount, uint256 remaining);
    event RewardClaimed(address indexed merchant, uint256 amount);
    
    modifier onlyOwner() { require(msg.sender == owner); _; }
    
    constructor(address _qiePayContract) {
        owner = msg.sender;
        qiePayContract = _qiePayContract;
        
        // Initialize tiers
        tierAmounts = [0, 100 ether, 500 ether, 1000 ether];
        tierFees = [250, 200, 150, 100]; // basis points
    }
    
    function stake() external payable {
        require(msg.value > 0, "Must stake > 0");
        StakeInfo storage s = stakes[msg.sender];
        s.amount += msg.value;
        s.stakedAt = block.timestamp;
        totalStaked += msg.value;
        if (s.amount == msg.value) stakerCount++;
        emit Staked(msg.sender, msg.value, s.amount);
    }
    
    function unstake(uint256 _amount) external {
        StakeInfo storage s = stakes[msg.sender];
        require(s.amount >= _amount, "Insufficient stake");
        s.amount -= _amount;
        totalStaked -= _amount;
        if (s.amount == 0) stakerCount--;
        
        (bool ok, ) = payable(msg.sender).call{value: _amount}("");
        require(ok, "Transfer failed");
        emit Unstaked(msg.sender, _amount, s.amount);
    }
    
    function getStake(address _merchant) external view returns (uint256) {
        return stakes[_merchant].amount;
    }
    
    function getFeeRate(address _merchant) external view returns (uint256) {
        uint256 staked = stakes[_merchant].amount;
        uint256 fee = tierFees[0]; // default 2.5%
        for (uint i = tierAmounts.length - 1; i > 0; i--) {
            if (staked >= tierAmounts[i]) { fee = tierFees[i]; break; }
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
    
    function getAllStakers() external view returns (address[] memory) {
        // Note: This is simplified. In production, maintain a stakers array.
        return new address[](0);
    }
    
    function setTier(uint256 _index, uint256 _amount, uint256 _fee) external onlyOwner {
        tierAmounts[_index] = _amount;
        tierFees[_index] = _fee;
    }
    
    receive() external payable {
        require(msg.value > 0, "Must stake > 0");
        StakeInfo storage s = stakes[msg.sender];
        s.amount += msg.value;
        s.stakedAt = block.timestamp;
        totalStaked += msg.value;
        if (s.amount == msg.value) stakerCount++;
        emit Staked(msg.sender, msg.value, s.amount);
    }
}
