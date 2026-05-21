require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  privateKey: process.env.PRIVATE_KEY || '',
  contractAddress: process.env.CONTRACT_ADDRESS || '',
  rpcUrl: process.env.RPC_URL || 'https://rpc1testnet.qie.digital/',
  chainId: parseInt(process.env.CHAIN_ID || '1983', 10),
};

// Validate required config
if (!config.contractAddress) {
  console.warn('⚠️  CONTRACT_ADDRESS not set. Set it in .env');
}
if (!config.privateKey) {
  console.warn('⚠️  PRIVATE_KEY not set. Write operations will fail.');
}

module.exports = config;
