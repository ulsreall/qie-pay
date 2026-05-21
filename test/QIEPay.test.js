const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QIEPay", function () {
  let qiePay;
  let owner, merchant, customer, feeRecipient;

  beforeEach(async function () {
    [owner, merchant, customer, feeRecipient] = await ethers.getSigners();

    const QIEPay = await ethers.getContractFactory("QIEPay");
    qiePay = await QIEPay.deploy(250, feeRecipient.address); // 2.5% fee
    await qiePay.waitForDeployment();
  });

  describe("Merchant Registration", function () {
    it("should register a merchant", async function () {
      await qiePay.connect(merchant).registerMerchant();
      expect(await qiePay.merchants(merchant.address)).to.be.true;
    });

    it("should not allow double registration", async function () {
      await qiePay.connect(merchant).registerMerchant();
      await expect(qiePay.connect(merchant).registerMerchant()).to.be.revertedWith(
        "QIEPay: already registered"
      );
    });
  });

  describe("Payment Flow", function () {
    beforeEach(async function () {
      await qiePay.connect(merchant).registerMerchant();
    });

    it("should create a payment", async function () {
      const tx = await qiePay.connect(merchant).createPayment("Test Order", "ORD-001");
      const receipt = await tx.wait();

      const payment = await qiePay.getPayment(1);
      expect(payment.merchant).to.equal(merchant.address);
      expect(payment.status).to.equal(0); // Created
    });

    it("should accept payment", async function () {
      await qiePay.connect(merchant).createPayment("Test Order", "ORD-001");

      const payAmount = ethers.parseEther("1.0");
      await qiePay.connect(customer).pay(1, { value: payAmount });

      const payment = await qiePay.getPayment(1);
      expect(payment.customer).to.equal(customer.address);
      expect(payment.amount).to.equal(payAmount);
      expect(payment.status).to.equal(1); // Paid
    });

    it("should settle payment to merchant", async function () {
      await qiePay.connect(merchant).createPayment("Test Order", "ORD-001");

      const payAmount = ethers.parseEther("1.0");
      await qiePay.connect(customer).pay(1, { value: payAmount });

      const merchantBalBefore = await ethers.provider.getBalance(merchant.address);
      await qiePay.connect(merchant).settlePayment(1);
      const merchantBalAfter = await ethers.provider.getBalance(merchant.address);

      // Merchant should receive amount minus fee (2.5%)
      const expectedFee = (payAmount * 250n) / 10000n;
      const expectedPayout = payAmount - expectedFee;
      expect(merchantBalAfter - merchantBalBefore).to.equal(expectedPayout);

      const payment = await qiePay.getPayment(1);
      expect(payment.status).to.equal(2); // Settled
    });

    it("should refund payment", async function () {
      await qiePay.connect(merchant).createPayment("Test Order", "ORD-001");

      const payAmount = ethers.parseEther("1.0");
      await qiePay.connect(customer).pay(1, { value: payAmount });

      const customerBalBefore = await ethers.provider.getBalance(customer.address);
      await qiePay.connect(merchant).refundPayment(1);
      const customerBalAfter = await ethers.provider.getBalance(customer.address);

      expect(customerBalAfter - customerBalBefore).to.equal(payAmount);

      const payment = await qiePay.getPayment(1);
      expect(payment.status).to.equal(3); // Refunded
    });

    it("should cancel unpaid payment", async function () {
      await qiePay.connect(merchant).createPayment("Test Order", "ORD-001");
      await qiePay.connect(merchant).cancelPayment(1);

      const payment = await qiePay.getPayment(1);
      expect(payment.status).to.equal(4); // Cancelled
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await qiePay.connect(merchant).registerMerchant();
    });

    it("should return merchant payments", async function () {
      await qiePay.connect(merchant).createPayment("Order 1", "ORD-001");
      await qiePay.connect(merchant).createPayment("Order 2", "ORD-002");

      const paymentIds = await qiePay.getMerchantPayments(merchant.address);
      expect(paymentIds.length).to.equal(2);
    });
  });
});
