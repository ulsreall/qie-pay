const express = require('express');
const { ethers } = require('ethers');
const { contractRead, contractWrite, formatPayment, parseContractError } = require('../contract');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * POST /register
 * Register the authenticated wallet as a merchant on-chain.
 * Requires auth headers.
 */
router.post('/register', authMiddleware, async (req, res) => {
  try {
    if (!contractWrite) {
      return res.status(503).json({ error: 'Server wallet not configured (missing PRIVATE_KEY)' });
    }

    // Check if already registered
    const isAlreadyMerchant = await contractRead.merchants(req.walletAddress);
    if (isAlreadyMerchant) {
      return res.status(409).json({ error: 'Already registered as merchant', address: req.walletAddress });
    }

    // NOTE: registerMerchant() uses msg.sender, so the backend signer
    // must be the wallet registering. In production, the merchant would
    // sign and submit the tx themselves. For this API, the server signer
    // calls the contract — it only works if server's PRIVATE_KEY matches.
    const tx = await contractWrite.registerMerchant();
    const receipt = await tx.wait();

    res.status(201).json({
      message: 'Merchant registered successfully',
      address: req.walletAddress,
      transactionHash: receipt.hash,
    });
  } catch (error) {
    console.error('POST /merchants/register error:', error);
    res.status(500).json({ error: 'Failed to register merchant', details: parseContractError(error) });
  }
});

/**
 * GET /:address
 * Get merchant info: registration status + earnings
 */
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    const [isMerchant, earnings, paymentIds] = await Promise.all([
      contractRead.merchants(address),
      contractRead.getMerchantEarnings(address),
      contractRead.getMerchantPayments(address),
    ]);

    res.json({
      address,
      isMerchant,
      earnings: ethers.formatEther(earnings),
      earningsWei: earnings.toString(),
      totalPayments: Number(paymentIds.length),
    });
  } catch (error) {
    console.error(`GET /merchants/${req.params.address} error:`, error);
    res.status(500).json({ error: 'Failed to fetch merchant info', details: parseContractError(error) });
  }
});

/**
 * GET /:address/payments
 * Get merchant's payment list with full details
 */
router.get('/:address/payments', async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    const paymentIds = await contractRead.getMerchantPayments(address);
    const ids = paymentIds.map((id) => Number(id));

    // Fetch full details for each payment
    const payments = [];
    for (const id of ids) {
      try {
        const payment = await contractRead.getPayment(id);
        payments.push(formatPayment(payment));
      } catch (err) {
        console.warn(`Failed to fetch payment ${id}:`, err.message);
      }
    }

    res.json({
      merchant: address,
      total: payments.length,
      payments,
    });
  } catch (error) {
    console.error(`GET /merchants/${req.params.address}/payments error:`, error);
    res.status(500).json({ error: 'Failed to fetch merchant payments', details: parseContractError(error) });
  }
});

module.exports = router;
