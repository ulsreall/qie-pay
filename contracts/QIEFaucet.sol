// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QIEFaucet
 * @notice Testnet faucet — drip QIE to any address, 1x per 24h per address.
 * @dev Owner can adjust drip amount, cooldown, and withdraw remaining funds.
 */
contract QIEFaucet {
    address public owner;
    uint256 public dripAmount;     // wei per drip
    uint256 public cooldown;       // seconds between drips per address
    mapping(address => uint256) public lastDrip;

    event Dripped(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(uint256 _dripAmount, uint256 _cooldown) {
        owner = msg.sender;
        dripAmount = _dripAmount;
        cooldown = _cooldown;
    }

    /// @notice Request testnet QIE. Each address can call once per cooldown.
    function drip() external {
        _dripTo(msg.sender);
    }

    /// @notice Drip to a specific address (for email wallet auto-funding).
    /// Anyone can call — cooldown is per recipient, not caller.
    function dripTo(address _to) external {
        _dripTo(_to);
    }

    function _dripTo(address _to) internal {
        require(
            block.timestamp >= lastDrip[_to] + cooldown,
            "Cooldown not met"
        );
        require(address(this).balance >= dripAmount, "Faucet empty");

        lastDrip[_to] = block.timestamp;
        (bool ok, ) = _to.call{value: dripAmount}("");
        require(ok, "Transfer failed");

        emit Dripped(_to, dripAmount);
    }

    /// @notice Check how long until an address can drip again.
    function timeUntilDrip(address _addr) external view returns (uint256) {
        uint256 next = lastDrip[_addr] + cooldown;
        if (block.timestamp >= next) return 0;
        return next - block.timestamp;
    }

    /// @notice Owner can adjust drip amount.
    function setDripAmount(uint256 _amount) external onlyOwner {
        dripAmount = _amount;
    }

    /// @notice Owner can adjust cooldown.
    function setCooldown(uint256 _cooldown) external onlyOwner {
        cooldown = _cooldown;
    }

    /// @notice Owner can withdraw remaining funds.
    function withdraw(uint256 _amount) external onlyOwner {
        require(address(this).balance >= _amount, "Insufficient");
        (bool ok, ) = owner.call{value: _amount}("");
        require(ok, "Withdraw failed");
    }

    /// @notice Fund the faucet (send QIE to this contract).
    receive() external payable {}
}
