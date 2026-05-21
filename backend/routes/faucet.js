const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

const FAUCET_ADDRESS = '0xe0BC1D6CC58E091F6A2866788D7D938895E1E2a6';
const FAUCET_ABI = [
  'function dripTo(address _to) external',
  'function timeUntilDrip(address _addr) external view returns (uint256)',
  'function dripAmount() external view returns (uint256)',
];

const RPC_URL = process.env.RPC_URL || 'https://rpc1testnet.qie.digital/';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

// Rate limit: 1 request per IP per 5 minutes
const ipCooldown = new Map();
const COOLDOWN_MS = 5 * 60 * 1000;

/**
 * POST /api/faucet/drip
 * Body: { address: "0x..." }
 * 
 * Auto-drips testnet QIE to a new email wallet.
 * Rate limited by IP + on-chain cooldown per address.
 */
router.post('/drip', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    // IP rate limit
    const ip = req.ip || req.connection.remoteAddress;
    const lastReq = ipCooldown.get(ip) || 0;
    if (Date.now() - lastReq < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (Date.now() - lastReq)) / 1000);
      return res.status(429).json({ error: `Rate limited. Try again in ${wait}s` });
    }

    if (!PRIVATE_KEY) {
      return res.status(503).json({ error: 'Faucet not configured (no PRIVATE_KEY)' });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, wallet);

    // Check on-chain cooldown
    const waitTime = await faucet.timeUntilDrip(address);
    if (waitTime > 0) {
      return res.status(429).json({ 
        error: `Address cooldown active. Try again in ${Number(waitTime)}s` 
      });
    }

    // Get drip amount for response
    const dripAmount = await faucet.dripAmount();

    // Call dripTo
    const tx = await faucet.dripTo(address);
    await tx.wait();

    ipCooldown.set(ip, Date.now());

    res.json({
      success: true,
      txHash: tx.hash,
      amount: ethers.formatEther(dripAmount),
      to: address,
      message: `${ethers.formatEther(dripAmount)} QIE sent to ${address.slice(0, 8)}...`,
    });
  } catch (err) {
    console.error('Faucet error:', err.message);
    if (err.message.includes('Cooldown not met')) {
      return res.status(429).json({ error: 'On-chain cooldown active. Wait 24h.' });
    }
    res.status(500).json({ error: 'Faucet request failed' });
  }
});

/**
 * GET /api/faucet/status/:address
 * Check if an address can receive from faucet.
 */
router.get('/status/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, provider);
    
    const [waitTime, dripAmount] = await Promise.all([
      faucet.timeUntilDrip(address),
      faucet.dripAmount(),
    ]);

    res.json({
      address,
      canDrip: waitTime === 0n,
      waitSeconds: Number(waitTime),
      dripAmount: ethers.formatEther(dripAmount),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check faucet status' });
  }
});

module.exports = router;
