import { ethers } from 'ethers';

const FAUCET_ADDRESS = '0xe0BC1D6CC58E091F6A2866788D7D938895E1E2a6';
const FAUCET_ABI = [
  'function dripTo(address _to) external',
  'function timeUntilDrip(address _addr) external view returns (uint256)',
  'function dripAmount() external view returns (uint256)',
  'function canDrip(address _addr) external view returns (bool)',
];

const RPC_URL = process.env.RPC_URL || 'https://rpc1testnet.qie.digital/';
const PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY || process.env.PRIVATE_KEY || '';

// ─── Server-side rate limiting ─────────────────────────────────
// In-memory store (per cold-start). For production, use Redis/KV.
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 5; // max 5 requests per IP per minute
const MAX_REQUESTS_PER_ADDRESS = 3; // max 3 requests per address per minute
const ipRequests = new Map();  // ip -> [{ timestamp }]
const addrRequests = new Map(); // address -> [{ timestamp }]

function cleanOldEntries(map, window) {
  const now = Date.now();
  for (const [key, entries] of map) {
    const filtered = entries.filter(t => now - t < window);
    if (filtered.length === 0) {
      map.delete(key);
    } else {
      map.set(key, filtered);
    }
  }
}

function checkRateLimit(identifier, store, maxRequests) {
  const now = Date.now();
  if (!store.has(identifier)) {
    store.set(identifier, []);
  }
  const entries = store.get(identifier).filter(t => now - t < RATE_LIMIT_WINDOW);
  store.set(identifier, entries);

  if (entries.length >= maxRequests) {
    return false; // rate limited
  }

  entries.push(now);
  return true; // allowed
}

// Clean old entries periodically (every 100 requests)
let requestCount = 0;
function maybeCleanup() {
  requestCount++;
  if (requestCount % 100 === 0) {
    cleanOldEntries(ipRequests, RATE_LIMIT_WINDOW);
    cleanOldEntries(addrRequests, RATE_LIMIT_WINDOW);
  }
}

// ─── Input validation ──────────────────────────────────────────
function isValidAddress(addr) {
  if (!addr || typeof addr !== 'string') return false;
  if (!addr.startsWith('0x')) return false;
  if (addr.length !== 42) return false;
  return ethers.isAddress(addr);
}

// ─── Handler ───────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  maybeCleanup();

  try {
    const { address } = req.body;

    // ─── Input validation ──────────────────────────────────────
    if (!address) {
      return res.status(400).json({ error: 'Missing address parameter' });
    }

    if (!isValidAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // Normalize address (checksum format)
    const normalizedAddress = ethers.getAddress(address);

    // ─── Server-side rate limiting ─────────────────────────────
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.socket?.remoteAddress
      || 'unknown';

    // IP-based rate limit
    if (!checkRateLimit(clientIP, ipRequests, MAX_REQUESTS_PER_WINDOW)) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Try again later.',
        retryAfter: 60,
      });
    }

    // Address-based rate limit
    if (!checkRateLimit(normalizedAddress.toLowerCase(), addrRequests, MAX_REQUESTS_PER_ADDRESS)) {
      return res.status(429).json({
        error: 'Too many requests for this address. Try again later.',
        retryAfter: 60,
      });
    }

    // ─── Faucet configuration check ────────────────────────────
    if (!PRIVATE_KEY || PRIVATE_KEY.length < 64) {
      return res.status(503).json({ error: 'Faucet not configured' });
    }

    // ─── On-chain operations ───────────────────────────────────
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const faucet = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, wallet);

    // On-chain cooldown check (24h per address)
    const waitTime = await faucet.timeUntilDrip(normalizedAddress);
    if (waitTime > 0) {
      const hours = Math.ceil(Number(waitTime) / 3600);
      return res.status(429).json({
        error: `Address already claimed. Try again in ${hours}h`,
        cooldownRemaining: Number(waitTime),
      });
    }

    // Check faucet balance before sending tx
    const [dripAmount, faucetBalance] = await Promise.all([
      faucet.dripAmount(),
      provider.getBalance(FAUCET_ADDRESS),
    ]);

    if (faucetBalance < dripAmount) {
      return res.status(503).json({ error: 'Faucet is empty. Please try again later.' });
    }

    // Execute drip
    const tx = await faucet.dripTo(normalizedAddress);
    await tx.wait();

    return res.status(200).json({
      success: true,
      txHash: tx.hash,
      amount: ethers.formatEther(dripAmount),
      to: normalizedAddress,
    });
  } catch (err) {
    console.error('Faucet error:', err.message);

    // Specific error handling
    if (err.message.includes('Cooldown not met') || err.message.includes('cooldown not met')) {
      return res.status(429).json({ error: 'Address already claimed. Wait 24h.' });
    }
    if (err.message.includes('Faucet: empty')) {
      return res.status(503).json({ error: 'Faucet is empty.' });
    }
    if (err.message.includes('insufficient funds')) {
      return res.status(503).json({ error: 'Faucet wallet has insufficient funds.' });
    }

    return res.status(500).json({ error: 'Faucet request failed' });
  }
}
