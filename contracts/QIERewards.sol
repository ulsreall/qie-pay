// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event RewardsMinted(address indexed to, uint256 amount, uint256 paymentId);
    event RewardsBurned(address indexed from, uint256 amount);
    
    modifier onlyOwner() { require(msg.sender == owner); _; }
    modifier onlyQIEPay() { require(msg.sender == qiePayContract); _; }
    
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
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) external returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    // Mint rewards when payment is settled (called by QIEPay contract or owner for demo)
    function mintRewards(address _customer, uint256 _paymentId) external {
        // 1 QIE paid = 1 QIEP earned
        uint256 reward = 1 ether; // simplified: fixed 1 QIEP per payment
        totalSupply += reward;
        balanceOf[_customer] += reward;
        emit RewardsMinted(_customer, reward, _paymentId);
    }
    
    // Burn QIEP for discount
    function redeemDiscount() external returns (uint256 discount) {
        require(balanceOf[msg.sender] >= burnForDiscount, "Insufficient QIEP");
        balanceOf[msg.sender] -= burnForDiscount;
        totalSupply -= burnForDiscount;
        emit RewardsBurned(msg.sender, burnForDiscount);
        return discountPercent;
    }
    
    function getDiscountInfo() external view returns (uint256 burnAmount, uint256 discount) {
        burnAmount = burnForDiscount;
        discount = discountPercent;
    }
    
    // Owner can mint (for rewards distribution)
    function mint(address _to, uint256 _amount) external onlyOwner {
        totalSupply += _amount;
        balanceOf[_to] += _amount;
        emit Transfer(address(0), _to, _amount);
    }
}
