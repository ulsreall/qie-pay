import { ethers } from 'ethers';

const FAUCET_ADDRESS = '0xe0BC1D6CC58E091F6A2866788D7D938895E1E2a6';
const FAUCET_ABI = [
  'function dripTo(address _to) external',
  'function timeUntilDrip(address _addr) external view returns (uint256)',
  'function dripAmount() external view returns (uint256)',
];

const RPC_URL = 'https://rpc1testnet.qie.digital/';
const PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY || process.env.PRIVATE_KEY || '';

// Rate limit per IP
const ipCooldown = new Map();
const COOLDOWN_MS = 5 * 60 * 1000;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.body;
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    // IP rate limit
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const lastReq = ipCooldown.get(ip) || 0;
    if (Date.now() - lastReq < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (Date.now() - lastReq)) / 1000);
      return res.status(429).json({ error: `Rate limited. Try again in ${wait}s` });
    }

    if (!PRIVATE_KEY) {
      return res.status(503).json({ error: 'Faucet not configured' });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, wallet);

    // Check on-chain cooldown
    const waitTime = await faucet.timeUntilDrip(address);
    if (waitTime > 0) {
      return res.status(429).json({
        error: `Cooldown active. Try again in ${Number(waitTime)}s`
      });
    }

    const dripAmount = await faucet.dripAmount();

    // Call dripTo
    const tx = await faucet.dripTo(address);
    await tx.wait();

    ipCooldown.set(ip, Date.now());

    return res.status(200).json({
      success: true,
      txHash: tx.hash,
      amount: ethers.formatEther(dripAmount),
      to: address,
    });
  } catch (err) {
    console.error('Faucet error:', err.message);
    if (err.message.includes('Cooldown not met')) {
      return res.status(429).json({ error: 'On-chain cooldown active. Wait 24h.' });
    }
    return res.status(500).json({ error: 'Faucet request failed' });
  }
}
