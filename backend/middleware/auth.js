const { ethers } = require('ethers');

/**
 * Auth middleware: verifies that the caller owns the wallet address
 * by checking a signed message. Expects headers:
 *   x-wallet-address: the wallet address
 *   x-wallet-signature: signed message (JSON stringified auth payload)
 *   x-wallet-message: the original message that was signed
 *
 * The signed message should contain a timestamp to prevent replay attacks.
 */
function authMiddleware(req, res, next) {
  try {
    const address = req.headers['x-wallet-address'];
    const signature = req.headers['x-wallet-signature'];
    const message = req.headers['x-wallet-message'];

    if (!address || !signature || !message) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Provide x-wallet-address, x-wallet-signature, and x-wallet-message headers',
      });
    }

    // Validate address format
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Verify the signature
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch {
      return res.status(401).json({ error: 'Invalid signature format' });
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    // Check message freshness (optional: max 5 min old)
    try {
      const parsed = JSON.parse(message);
      if (parsed.timestamp) {
        const age = Date.now() - parsed.timestamp;
        if (age > 5 * 60 * 1000) {
          return res.status(401).json({ error: 'Signature expired (max 5 minutes)' });
        }
      }
    } catch {
      // Message is not JSON — that's fine, skip timestamp check
    }

    // Attach verified address to request
    req.walletAddress = recoveredAddress;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

module.exports = authMiddleware;
