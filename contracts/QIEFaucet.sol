// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QIEFaucet
 * @notice Testnet faucet — drip QIE to any address, 1x per 24h per address.
 * @dev SECURITY: dripTo() restricted to owner only (server-side API).
 *      drip() is public for self-service claiming with per-address cooldown.
 *      Owner can adjust drip amount, cooldown, and withdraw remaining funds.
 */
contract QIEFaucet {
    address public owner;
    uint256 public dripAmount;     // wei per drip
    uint256 public cooldown;       // seconds between drips per address
    mapping(address => uint256) public lastDrip;

    // Track total drips for monitoring
    uint256 public totalDrips;
    uint256 public totalDripped;

    event Dripped(address indexed to, uint256 amount, address indexed caller);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Faucet: not owner");
        _;
    }

    constructor(uint256 _dripAmount, uint256 _cooldown) {
        owner = msg.sender;
        dripAmount = _dripAmount;
        cooldown = _cooldown;
    }

    /**
     * @notice Request testnet QIE for yourself.
     * @dev Public — each address can call once per cooldown period.
     */
    function drip() external {
        _dripTo(msg.sender, msg.sender);
    }

    /**
     * @notice Drip to a specific address (for email wallet auto-funding).
     * @dev SECURITY: Only owner (server wallet) can call.
     *      Prevents attackers from draining faucet to arbitrary addresses.
     * @param _to Recipient address
     */
    function dripTo(address _to) external onlyOwner {
        _dripTo(_to, msg.sender);
    }

    function _dripTo(address _to, address _caller) internal {
        require(_to != address(0), "Faucet: zero address");
        require(
            block.timestamp >= lastDrip[_to] + cooldown,
            "Faucet: cooldown not met"
        );
        require(address(this).balance >= dripAmount, "Faucet: empty");

        lastDrip[_to] = block.timestamp;
        totalDrips++;
        totalDripped += dripAmount;

        (bool ok, ) = _to.call{value: dripAmount}("");
        require(ok, "Faucet: transfer failed");

        emit Dripped(_to, dripAmount, _caller);
    }

    /**
     * @notice Check how long until an address can drip again.
     */
    function timeUntilDrip(address _addr) external view returns (uint256) {
        uint256 next = lastDrip[_addr] + cooldown;
        if (block.timestamp >= next) return 0;
        return next - block.timestamp;
    }

    /**
     * @notice Check if an address can drip now.
     */
    function canDrip(address _addr) external view returns (bool) {
        return block.timestamp >= lastDrip[_addr] + cooldown;
    }

    // ─── Owner Functions ──────────────────────────────────────────

    function setDripAmount(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Faucet: zero amount");
        dripAmount = _amount;
    }

    function setCooldown(uint256 _cooldown) external onlyOwner {
        require(_cooldown >= 1 hours, "Faucet: min 1 hour cooldown");
        cooldown = _cooldown;
    }

    /**
     * @notice Owner can withdraw remaining funds.
     */
    function withdraw(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Faucet: zero amount");
        require(address(this).balance >= _amount, "Faucet: insufficient");

        (bool ok, ) = owner.call{value: _amount}("");
        require(ok, "Faucet: withdraw failed");
    }

    /**
     * @notice Withdraw all remaining funds.
     */
    function withdrawAll() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "Faucet: empty");

        (bool ok, ) = owner.call{value: bal}("");
        require(ok, "Faucet: withdraw failed");
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Faucet: zero address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    /**
     * @notice Fund the faucet (send QIE to this contract).
     */
    receive() external payable {}
}
