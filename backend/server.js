const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');

// ─── Import Routes ────────────────────────────────────────────
const paymentsRouter = require('./routes/payments');
const merchantsRouter = require('./routes/merchants');
const faucetRouter = require('./routes/faucet');

// ─── App Setup ────────────────────────────────────────────────
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/payments', paymentsRouter);
app.use('/api/merchants', merchantsRouter);
app.use('/api/faucet', faucetRouter);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { provider, contractRead } = require('./contract');
    let blockNumber = null;
    try {
      blockNumber = await provider.getBlockNumber();
    } catch {
      blockNumber = 'unavailable';
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      chain: {
        rpc: config.rpcUrl,
        chainId: config.chainId,
        blockNumber,
      },
      contract: config.contractAddress || 'not configured',
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`🚀 QIEPay API running on port ${config.port}`);
  console.log(`📡 RPC: ${config.rpcUrl}`);
  console.log(`📄 Contract: ${config.contractAddress || 'not configured'}`);
  console.log(`🔗 Health: http://localhost:${config.port}/api/health`);
});

module.exports = app;
