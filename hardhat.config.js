require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    qieTestnet: {
      url: "https://rpc1testnet.qie.digital/",
      chainId: 1983,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    qieMainnet: {
      url: "https://rpc1mainnet.qie.digital/",
      chainId: 1990,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      qieTestnet: "placeholder",
    },
    customChains: [
      {
        network: "qieTestnet",
        chainId: 1983,
        urls: {
          apiURL: "https://testnet.qie.digital/api",
          browserURL: "https://testnet.qie.digital",
        },
      },
    ],
  },
};
