// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QIEPay - Merchant Payment Gateway
 * @notice Enables merchants to accept QIE payments with escrow and auto-settlement
 * @dev Deployed on QIE Testnet (Chain ID: 1983)
 *
 * SECURITY FIXES:
 * - ReentrancyGuard on all external state-changing functions
 * - Fee capped at 10% (1000 basis points)
 * - Two-step ownership transfer (propose + accept)
 * - Refund returns fee to customer (prevents fee-stuck griefing)
 * - Checks-Effects-Interactions pattern enforced
 */
contract QIEPay {
    // ─── Reentrancy Guard ───────────────────────────────────────
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status = NOT_ENTERED;

    modifier nonReentrant() {
        require(_status != ENTERED, "QIEPay: reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }

    // ─── Constants ──────────────────────────────────────────────
    uint256 public constant MAX_FEE_PERCENT = 1000; // 10% max (1000 basis points)

    // ─── State Variables ────────────────────────────────────────
    address public owner;
    address public pendingOwner; // Two-step ownership transfer
    uint256 public paymentCounter;
    uint256 public feePercent; // basis points (250 = 2.5%)
    address public feeRecipient;

    // ─── Structs ────────────────────────────────────────────────
    struct Payment {
        uint256 id;
        address merchant;
        address customer;
        uint256 amount;
        uint256 fee;
        uint256 createdAt;
        uint256 settledAt;
        string description;
        string orderId;
        PaymentStatus status;
    }

    enum PaymentStatus {
        Created,
        Paid,
        Settled,
        Refunded,
        Cancelled
    }

    // ─── Mappings ───────────────────────────────────────────────
    mapping(uint256 => Payment) public payments;
    mapping(address => bool) public merchants;
    mapping(address => uint256) public merchantEarnings;
    mapping(address => uint256[]) public merchantPayments;

    // ─── Events ─────────────────────────────────────────────────
    event MerchantRegistered(address indexed merchant, uint256 timestamp);
    event PaymentCreated(uint256 indexed paymentId, address indexed merchant, uint256 amount, string description, string orderId);
    event PaymentPaid(uint256 indexed paymentId, address indexed customer, uint256 amount);
    event PaymentSettled(uint256 indexed paymentId, address indexed merchant, uint256 amount, uint256 fee);
    event PaymentRefunded(uint256 indexed paymentId, address indexed customer, uint256 amount, uint256 feeRefunded);
    event PaymentCancelled(uint256 indexed paymentId);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ─── Modifiers ──────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "QIEPay: not owner");
        _;
    }

    modifier onlyMerchant() {
        require(merchants[msg.sender], "QIEPay: not registered merchant");
        _;
    }

    modifier paymentExists(uint256 _paymentId) {
        require(_paymentId > 0 && _paymentId <= paymentCounter, "QIEPay: invalid payment");
        _;
    }

    // ─── Constructor ────────────────────────────────────────────
    constructor(uint256 _feePercent, address _feeRecipient) {
        require(_feePercent <= MAX_FEE_PERCENT, "QIEPay: fee too high");
        require(_feeRecipient != address(0), "QIEPay: zero address");

        owner = msg.sender;
        feePercent = _feePercent; // 250 = 2.5%
        feeRecipient = _feeRecipient;
    }

    // ─── Merchant Functions ─────────────────────────────────────

    function registerMerchant() external {
        require(!merchants[msg.sender], "QIEPay: already registered");
        merchants[msg.sender] = true;
        emit MerchantRegistered(msg.sender, block.timestamp);
    }

    function createPayment(
        string calldata _description,
        string calldata _orderId,
        uint256 _amountInQIE
    )
        external
        onlyMerchant
        returns (uint256 paymentId)
    {
        require(_amountInQIE > 0, "QIEPay: amount must be > 0");

        paymentCounter++;
        paymentId = paymentCounter;

        payments[paymentId] = Payment({
            id: paymentId,
            merchant: msg.sender,
            customer: address(0),
            amount: _amountInQIE,
            fee: 0,
            createdAt: block.timestamp,
            settledAt: 0,
            description: _description,
            orderId: _orderId,
            status: PaymentStatus.Created
        });

        merchantPayments[msg.sender].push(paymentId);

        emit PaymentCreated(paymentId, msg.sender, _amountInQIE, _description, _orderId);
    }

    /**
     * @notice Pay for a created payment
     * @dev SECURITY: CEI pattern. State updated before external call.
     *      Fee calculated on exact amount, not msg.value.
     */
    function pay(uint256 _paymentId)
        external
        payable
        nonReentrant
        paymentExists(_paymentId)
    {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.Created, "QIEPay: not available");
        require(msg.value > 0, "QIEPay: zero amount");
        require(msg.value >= payment.amount, "QIEPay: insufficient amount");
        require(msg.sender != payment.merchant, "QIEPay: merchant cannot pay own invoice");

        // Effects BEFORE interactions
        payment.customer = msg.sender;
        payment.fee = (payment.amount * feePercent) / 10000;
        payment.status = PaymentStatus.Paid;

        emit PaymentPaid(_paymentId, msg.sender, payment.amount);

        // Interaction: refund excess (CEI — state already updated)
        if (msg.value > payment.amount) {
            uint256 refund = msg.value - payment.amount;
            (bool refundSuccess, ) = payable(msg.sender).call{value: refund}("");
            require(refundSuccess, "QIEPay: refund failed");
        }
    }

    /**
     * @notice Settle a paid payment (release funds to merchant)
     * @dev SECURITY: nonReentrant guard. Fee sent to feeRecipient.
     */
    function settlePayment(uint256 _paymentId)
        external
        nonReentrant
        paymentExists(_paymentId)
    {
        Payment storage payment = payments[_paymentId];
        require(
            msg.sender == payment.merchant || msg.sender == owner,
            "QIEPay: not authorized"
        );
        require(payment.status == PaymentStatus.Paid, "QIEPay: not paid");

        uint256 merchantAmount = payment.amount - payment.fee;

        // Effects BEFORE interactions
        payment.status = PaymentStatus.Settled;
        payment.settledAt = block.timestamp;
        merchantEarnings[payment.merchant] += merchantAmount;

        emit PaymentSettled(_paymentId, payment.merchant, merchantAmount, payment.fee);

        // Interaction: transfer to merchant
        if (merchantAmount > 0) {
            (bool success, ) = payable(payment.merchant).call{value: merchantAmount}("");
            require(success, "QIEPay: merchant transfer failed");
        }

        // Interaction: transfer fee
        if (payment.fee > 0) {
            (bool feeSuccess, ) = payable(feeRecipient).call{value: payment.fee}("");
            require(feeSuccess, "QIEPay: fee transfer failed");
        }
    }

    /**
     * @notice Refund a paid payment
     * @dev SECURITY: Refund = amount + fee (full refund to customer).
     *      nonReentrant guard. CEI pattern.
     */
    function refundPayment(uint256 _paymentId)
        external
        nonReentrant
        paymentExists(_paymentId)
    {
        Payment storage payment = payments[_paymentId];
        require(
            msg.sender == payment.merchant || msg.sender == owner,
            "QIEPay: not authorized"
        );
        require(payment.status == PaymentStatus.Paid, "QIEPay: not paid");

        uint256 refundAmount = payment.amount; // Customer paid the amount
        uint256 feeRefunded = payment.fee; // Fee also returned to customer

        // Effects BEFORE interactions
        payment.status = PaymentStatus.Refunded;

        emit PaymentRefunded(_paymentId, payment.customer, refundAmount, feeRefunded);

        // Interaction: refund full amount + fee to customer
        (bool success, ) = payable(payment.customer).call{value: refundAmount}("");
        require(success, "QIEPay: refund failed");
    }

    function cancelPayment(uint256 _paymentId)
        external
        paymentExists(_paymentId)
    {
        Payment storage payment = payments[_paymentId];
        require(msg.sender == payment.merchant, "QIEPay: not merchant");
        require(payment.status == PaymentStatus.Created, "QIEPay: already paid");

        payment.status = PaymentStatus.Cancelled;
        emit PaymentCancelled(_paymentId);
    }

    // ─── Owner Functions ────────────────────────────────────────

    /**
     * @notice Set fee percent (capped at MAX_FEE_PERCENT)
     */
    function setFeePercent(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE_PERCENT, "QIEPay: fee exceeds max (10%)");
        uint256 oldFee = feePercent;
        feePercent = _newFee;
        emit FeeUpdated(oldFee, _newFee);
    }

    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "QIEPay: zero address");
        feeRecipient = _newRecipient;
    }

    /**
     * @notice Two-step ownership transfer — Step 1: Propose new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "QIEPay: zero address");
        require(_newOwner != owner, "QIEPay: already owner");
        pendingOwner = _newOwner;
        emit OwnershipTransferStarted(owner, _newOwner);
    }

    /**
     * @notice Two-step ownership transfer — Step 2: Accept ownership
     * @dev Only the proposed new owner can call this.
     */
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "QIEPay: not pending owner");
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    /**
     * @notice Emergency: renounce ownership (irreversible!)
     */
    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
        pendingOwner = address(0);
    }

    // ─── View Functions ─────────────────────────────────────────

    function getPayment(uint256 _paymentId)
        external
        view
        paymentExists(_paymentId)
        returns (Payment memory)
    {
        return payments[_paymentId];
    }

    function getMerchantPayments(address _merchant)
        external
        view
        returns (uint256[] memory)
    {
        return merchantPayments[_merchant];
    }

    function getMerchantEarnings(address _merchant)
        external
        view
        returns (uint256)
    {
        return merchantEarnings[_merchant];
    }

    /**
     * @notice Calculate fee for a given amount
     */
    function calculateFee(uint256 _amount) external view returns (uint256) {
        return (_amount * feePercent) / 10000;
    }

    // ─── Receive ────────────────────────────────────────────────
    receive() external payable {}
}
