const express = require('express');
const { ethers } = require('ethers');
const { contractRead, contractWrite, formatPayment, parseContractError, provider, signer } = require('../contract');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /
 * List all payments by querying PaymentCreated events
 */
router.get('/', async (req, res) => {
  try {
    const { fromBlock = 0, toBlock = 'latest', page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    // Query PaymentCreated events to get all payment IDs
    const filter = contractRead.filters.PaymentCreated();
    const events = await contractRead.queryFilter(filter, fromBlock, toBlock);

    // Fetch each payment's current state
    const payments = [];
    for (const event of events) {
      try {
        const paymentId = Number(event.args.paymentId);
        const payment = await contractRead.getPayment(paymentId);
        payments.push(formatPayment(payment));
      } catch (err) {
        console.warn(`Failed to fetch payment from event:`, err.message);
      }
    }

    // Paginate
    const start = (pageNum - 1) * limitNum;
    const paginated = payments.slice(start, start + limitNum);

    res.json({
      total: payments.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(payments.length / limitNum),
      payments: paginated,
    });
  } catch (error) {
    console.error('GET /payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments', details: parseContractError(error) });
  }
});

/**
 * GET /:id
 * Get a single payment by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    if (isNaN(paymentId) || paymentId < 1) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }

    const payment = await contractRead.getPayment(paymentId);
    if (Number(payment.id) === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(formatPayment(payment));
  } catch (error) {
    console.error(`GET /payments/${req.params.id} error:`, error);
    if (error.message?.includes('invalid payment')) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.status(500).json({ error: 'Failed to fetch payment', details: parseContractError(error) });
  }
});

/**
 * POST /create
 * Create a new payment request (merchant only)
 * Body: { description: string, orderId: string }
 * Requires auth headers
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    if (!contractWrite) {
      return res.status(503).json({ error: 'Server wallet not configured (missing PRIVATE_KEY)' });
    }

    const { description, orderId } = req.body;
    if (!description || !orderId) {
      return res.status(400).json({ error: 'description and orderId are required' });
    }

    // Check if the authenticated wallet is a registered merchant
    const isMerchant = await contractRead.merchants(req.walletAddress);
    if (!isMerchant) {
      return res.status(403).json({ error: 'Not a registered merchant' });
    }

    // Since createPayment requires onlyMerchant modifier (msg.sender),
    // the backend signer must BE the merchant. Alternatively, we can
    // use the server wallet if it's the merchant.
    // For a production system, the merchant would sign this themselves.
    // Here we use the server's signer — it must be the merchant wallet.

    const tx = await contractWrite.createPayment(description, orderId);
    const receipt = await tx.wait();

    // Parse the PaymentCreated event from the receipt
    const event = receipt.logs.find((log) => {
      try {
        const parsed = contractRead.interface.parseLog(log);
        return parsed.name === 'PaymentCreated';
      } catch {
        return false;
      }
    });

    let paymentId = null;
    if (event) {
      const parsed = contractRead.interface.parseLog(event);
      paymentId = Number(parsed.args.paymentId);
    }

    const payment = paymentId ? await contractRead.getPayment(paymentId) : null;

    res.status(201).json({
      message: 'Payment created',
      transactionHash: receipt.hash,
      payment: payment ? formatPayment(payment) : null,
    });
  } catch (error) {
    console.error('POST /payments/create error:', error);
    res.status(500).json({ error: 'Failed to create payment', details: parseContractError(error) });
  }
});

/**
 * POST /settle/:id
 * Settle a paid payment
 * Requires auth headers (must be the merchant or owner)
 */
router.post('/settle/:id', authMiddleware, async (req, res) => {
  try {
    if (!contractWrite) {
      return res.status(503).json({ error: 'Server wallet not configured' });
    }

    const paymentId = parseInt(req.params.id);
    if (isNaN(paymentId) || paymentId < 1) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }

    // Verify the caller is the merchant for this payment
    const payment = await contractRead.getPayment(paymentId);
    if (Number(payment.id) === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (
      req.walletAddress.toLowerCase() !== payment.merchant.toLowerCase() &&
      req.walletAddress.toLowerCase() !== (await contractRead.owner()).toLowerCase()
    ) {
      return res.status(403).json({ error: 'Not authorized to settle this payment' });
    }

    const tx = await contractWrite.settlePayment(paymentId);
    const receipt = await tx.wait();

    const updated = await contractRead.getPayment(paymentId);

    res.json({
      message: 'Payment settled',
      transactionHash: receipt.hash,
      payment: formatPayment(updated),
    });
  } catch (error) {
    console.error(`POST /payments/settle/${req.params.id} error:`, error);
    res.status(500).json({ error: 'Failed to settle payment', details: parseContractError(error) });
  }
});

/**
 * POST /refund/:id
 * Refund a paid payment
 * Requires auth headers (must be the merchant or owner)
 */
router.post('/refund/:id', authMiddleware, async (req, res) => {
  try {
    if (!contractWrite) {
      return res.status(503).json({ error: 'Server wallet not configured' });
    }

    const paymentId = parseInt(req.params.id);
    if (isNaN(paymentId) || paymentId < 1) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }

    const payment = await contractRead.getPayment(paymentId);
    if (Number(payment.id) === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (
      req.walletAddress.toLowerCase() !== payment.merchant.toLowerCase() &&
      req.walletAddress.toLowerCase() !== (await contractRead.owner()).toLowerCase()
    ) {
      return res.status(403).json({ error: 'Not authorized to refund this payment' });
    }

    const tx = await contractWrite.refundPayment(paymentId);
    const receipt = await tx.wait();

    const updated = await contractRead.getPayment(paymentId);

    res.json({
      message: 'Payment refunded',
      transactionHash: receipt.hash,
      payment: formatPayment(updated),
    });
  } catch (error) {
    console.error(`POST /payments/refund/${req.params.id} error:`, error);
    res.status(500).json({ error: 'Failed to refund payment', details: parseContractError(error) });
  }
});

/**
 * GET /merchant/:address
 * Get all payment IDs for a merchant
 */
router.get('/merchant/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    const paymentIds = await contractRead.getMerchantPayments(address);
    const ids = paymentIds.map((id) => Number(id));

    // Fetch full payment details for each ID
    const payments = [];
    for (const id of ids) {
      try {
        const payment = await contractRead.getPayment(id);
        payments.push(formatPayment(payment));
      } catch (err) {
        console.warn(`Failed to fetch payment ${id}:`, err.message);
      }
    }

    res.json({ merchant: address, total: payments.length, payments });
  } catch (error) {
    console.error(`GET /payments/merchant/${req.params.address} error:`, error);
    res.status(500).json({ error: 'Failed to fetch merchant payments', details: parseContractError(error) });
  }
});

module.exports = router;
