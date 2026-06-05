// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QIERewards
 * @notice ERC-20-like reward token for QIEPay merchants
 * @dev SECURITY: mintRewards() restricted to owner only.
 *      Transfer functions include zero-amount and self-transfer checks.
 */
contract QIERewards {
    string public name = "QIE Pay Rewards";
    string public symbol = "QIEP";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public owner;
    address public qiePayContract;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Merchant discount config: burn X QIEP = Y% discount
    uint256 public burnForDiscount = 10 ether; // 10 QIEP = 10% discount
    uint256 public discountPercent = 10; // 10%

    // Track which payment IDs have already been rewarded (prevent double-mint)
    mapping(uint256 => bool) public paymentRewarded;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event RewardsMinted(address indexed to, uint256 amount, uint256 paymentId);
    event RewardsBurned(address indexed from, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "QIERewards: not owner");
        _;
    }

    constructor(address _qiePayContract) {
        owner = msg.sender;
        qiePayContract = _qiePayContract;

        // Mint initial supply for rewards pool
        uint256 initialSupply = 1_000_000 ether; // 1M QIEP
        totalSupply = initialSupply;
        balanceOf[msg.sender] = initialSupply;
        emit Transfer(address(0), msg.sender, initialSupply);
    }

    function transfer(address _to, uint256 _value) external returns (bool) {
        require(_to != address(0), "QIERewards: transfer to zero address");
        require(_value > 0, "QIERewards: zero amount");
        require(msg.sender != _to, "QIERewards: self-transfer");
        require(balanceOf[msg.sender] >= _value, "QIERewards: insufficient balance");

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) external returns (bool) {
        require(_spender != address(0), "QIERewards: approve to zero address");
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) external returns (bool) {
        require(_to != address(0), "QIERewards: transfer to zero address");
        require(_value > 0, "QIERewards: zero amount");
        require(balanceOf[_from] >= _value, "QIERewards: insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "QIERewards: insufficient allowance");

        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    /**
     * @notice Mint rewards when payment is settled
     * @dev SECURITY: Only owner can call. Each payment can only be rewarded once.
     *      In production, integrate with QIEPay.settlePayment() via onlyQIEPay modifier.
     */
    function mintRewards(address _customer, uint256 _paymentId) external onlyOwner {
        require(_customer != address(0), "QIERewards: zero address");
        require(!paymentRewarded[_paymentId], "QIERewards: already rewarded");

        uint256 reward = 1 ether; // 1 QIEP per payment
        paymentRewarded[_paymentId] = true;
        totalSupply += reward;
        balanceOf[_customer] += reward;
        emit RewardsMinted(_customer, reward, _paymentId);
        emit Transfer(address(0), _customer, reward);
    }

    /**
     * @notice Burn QIEP for merchant fee discount
     */
    function redeemDiscount() external returns (uint256 discount) {
        require(balanceOf[msg.sender] >= burnForDiscount, "QIERewards: insufficient QIEP");

        balanceOf[msg.sender] -= burnForDiscount;
        totalSupply -= burnForDiscount;
        emit RewardsBurned(msg.sender, burnForDiscount);
        emit Transfer(msg.sender, address(0), burnForDiscount);
        return discountPercent;
    }

    function getDiscountInfo() external view returns (uint256 burnAmount, uint256 discount) {
        burnAmount = burnForDiscount;
        discount = discountPercent;
    }

    /**
     * @notice Owner can mint (for rewards distribution)
     * @dev SECURITY: Only owner. Consider adding supply cap in production.
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "QIERewards: mint to zero address");
        require(_amount > 0, "QIERewards: zero amount");

        totalSupply += _amount;
        balanceOf[_to] += _amount;
        emit Transfer(address(0), _to, _amount);
    }

    /**
     * @notice Transfer ownership (two-step: propose + accept pattern recommended)
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "QIERewards: zero address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}
