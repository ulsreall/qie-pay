// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QIEPay - Merchant Payment Gateway
 * @notice Enables merchants to accept QIE payments with escrow and auto-settlement
 * @dev Deployed on QIE Testnet (Chain ID: 1983)
 */
contract QIEPay {
    // ─── State Variables ──────────────────────────────────────────────
    address public owner;
    uint256 public paymentCounter;
    uint256 public feePercent; // basis points (100 = 1%)
    address public feeRecipient;

    // ─── Structs ──────────────────────────────────────────────────────
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

    // ─── Mappings ─────────────────────────────────────────────────────
    mapping(uint256 => Payment) public payments;
    mapping(address => bool) public merchants;
    mapping(address => uint256) public merchantEarnings;
    mapping(address => uint256[]) public merchantPayments;

    // ─── Events ───────────────────────────────────────────────────────
    event MerchantRegistered(address indexed merchant, uint256 timestamp);
    event PaymentCreated(uint256 indexed paymentId, address indexed merchant, uint256 amount, string description, string orderId);
    event PaymentPaid(uint256 indexed paymentId, address indexed customer, uint256 amount);
    event PaymentSettled(uint256 indexed paymentId, address indexed merchant, uint256 amount, uint256 fee);
    event PaymentRefunded(uint256 indexed paymentId, address indexed customer, uint256 amount);
    event PaymentCancelled(uint256 indexed paymentId);
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    // ─── Modifiers ────────────────────────────────────────────────────
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

    // ─── Constructor ──────────────────────────────────────────────────
    constructor(uint256 _feePercent, address _feeRecipient) {
        owner = msg.sender;
        feePercent = _feePercent; // 250 = 2.5%
        feeRecipient = _feeRecipient;
    }

    // ─── Merchant Functions ───────────────────────────────────────────

    /**
     * @notice Register as a merchant
     */
    function registerMerchant() external {
        require(!merchants[msg.sender], "QIEPay: already registered");
        merchants[msg.sender] = true;
        emit MerchantRegistered(msg.sender, block.timestamp);
    }

    /**
     * @notice Create a payment request
     * @param _description Description of the payment
     * @param _orderId Merchant's order ID
     * @return paymentId The created payment ID
     */
    function createPayment(string calldata _description, string calldata _orderId)
        external
        onlyMerchant
        returns (uint256 paymentId)
    {
        paymentCounter++;
        paymentId = paymentCounter;

        payments[paymentId] = Payment({
            id: paymentId,
            merchant: msg.sender,
            customer: address(0),
            amount: 0,
            fee: 0,
            createdAt: block.timestamp,
            settledAt: 0,
            description: _description,
            orderId: _orderId,
            status: PaymentStatus.Created
        });

        merchantPayments[msg.sender].push(paymentId);

        emit PaymentCreated(paymentId, msg.sender, 0, _description, _orderId);
    }

    /**
     * @notice Pay for a created payment
     * @param _paymentId The payment ID to pay
     */
    function pay(uint256 _paymentId)
        external
        payable
        paymentExists(_paymentId)
    {
        Payment storage payment = payments[_paymentId];
        require(payment.status == PaymentStatus.Created, "QIEPay: not available");
        require(msg.value > 0, "QIEPay: zero amount");
        require(msg.sender != payment.merchant, "QIEPay: merchant cannot pay own invoice");

        payment.customer = msg.sender;
        payment.amount = msg.value;
        payment.fee = (msg.value * feePercent) / 10000;
        payment.status = PaymentStatus.Paid;

        emit PaymentPaid(_paymentId, msg.sender, msg.value);
    }

    /**
     * @notice Settle a paid payment (release funds to merchant)
     * @param _paymentId The payment ID to settle
     */
    function settlePayment(uint256 _paymentId)
        external
        paymentExists(_paymentId)
    {
        Payment storage payment = payments[_paymentId];
        require(
            msg.sender == payment.merchant || msg.sender == owner,
            "QIEPay: not authorized"
        );
        require(payment.status == PaymentStatus.Paid, "QIEPay: not paid");

        uint256 merchantAmount = payment.amount - payment.fee;

        payment.status = PaymentStatus.Settled;
        payment.settledAt = block.timestamp;

        merchantEarnings[payment.merchant] += merchantAmount;

        // Transfer to merchant
        (bool success, ) = payable(payment.merchant).call{value: merchantAmount}("");
        require(success, "QIEPay: merchant transfer failed");

        // Transfer fee
        if (payment.fee > 0) {
            (bool feeSuccess, ) = payable(feeRecipient).call{value: payment.fee}("");
            require(feeSuccess, "QIEPay: fee transfer failed");
        }

        emit PaymentSettled(_paymentId, payment.merchant, merchantAmount, payment.fee);
    }

    /**
     * @notice Refund a paid payment
     * @param _paymentId The payment ID to refund
     */
    function refundPayment(uint256 _paymentId)
        external
        paymentExists(_paymentId)
    {
        Payment storage payment = payments[_paymentId];
        require(
            msg.sender == payment.merchant || msg.sender == owner,
            "QIEPay: not authorized"
        );
        require(payment.status == PaymentStatus.Paid, "QIEPay: not paid");

        payment.status = PaymentStatus.Refunded;

        (bool success, ) = payable(payment.customer).call{value: payment.amount}("");
        require(success, "QIEPay: refund failed");

        emit PaymentRefunded(_paymentId, payment.customer, payment.amount);
    }

    /**
     * @notice Cancel a created (unpaid) payment
     * @param _paymentId The payment ID to cancel
     */
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

    // ─── Owner Functions ──────────────────────────────────────────────

    function setFeePercent(uint256 _newFee) external onlyOwner {
        uint256 oldFee = feePercent;
        feePercent = _newFee;
        emit FeeUpdated(oldFee, _newFee);
    }

    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "QIEPay: zero address");
        feeRecipient = _newRecipient;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "QIEPay: zero address");
        owner = _newOwner;
    }

    // ─── View Functions ───────────────────────────────────────────────

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

    // ─── Receive ──────────────────────────────────────────────────────
    receive() external payable {
        // Allow direct deposits (no payment ID) - treat as advance payment
    }
}
