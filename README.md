# 💜 QIE Pay — Merchant Payment Gateway

> Accept crypto payments in seconds. Built on QIE Blockchain.

QIE Pay is a decentralized payment gateway that enables merchants to accept QIE token payments with automatic settlement, escrow protection, and real-time analytics.

## 🏆 QIE Blockchain Hackathon Submission

- **Track:** DeFi & Payments
- **Network:** QIE Testnet (Chain ID: 1983)
- **Contract:** `0x...` *(will be updated after deployment)*

## 🚀 Features

- **Instant Payments** — Leverage QIE's 30K TPS and 1-2s finality
- **Escrow Protection** — Funds held safely until merchant settles
- **Low Fees** — 2.5% platform fee (configurable)
- **Refund Support** — Full refund capability for merchants
- **MetaMask Integration** — One-click wallet connection
- **Real-time Dashboard** — Track payments, earnings, analytics

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│   Contract   │
│  React/Vite  │     │  Express.js  │     │   Solidity   │
│  TailwindCSS │     │  ethers.js   │     │   QIE Testnet│
└──────────────┘     └──────────────┘     └──────────────┘
```

## 📁 Project Structure

```
qie-pay/
├── contracts/
│   └── QIEPay.sol          # Smart contract
├── scripts/
│   └── deploy.js           # Deployment script
├── test/
│   └── QIEPay.test.js      # Contract tests
├── backend/
│   ├── server.js           # Express API server
│   ├── routes/             # API routes
│   ├── middleware/          # Auth middleware
│   └── contract.js         # Contract interaction
├── frontend/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── components/     # React components
│   │   └── utils/          # Helpers & constants
│   └── vite.config.js
└── hardhat.config.js
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.20 |
| Blockchain | QIE Testnet (EVM compatible) |
| Backend | Node.js, Express, ethers.js |
| Frontend | React, Vite, TailwindCSS |
| Wallet | MetaMask |
| Hosting | Vercel (frontend), Railway (backend) |

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- QIE Testnet tokens ([Faucet](https://www.qie.digital/faucet))

### 1. Add QIE Testnet to MetaMask
```
Network Name: QIE Testnet
RPC URL: https://rpc1testnet.qie.digital/
Chain ID: 1983
Currency Symbol: QIE
Explorer: https://testnet.qie.digital/
```

### 2. Deploy Contract
```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network qieTestnet
```

### 3. Start Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your contract address and private key
npm start
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/merchants/register` | Register as merchant |
| GET | `/api/merchants/:address` | Get merchant info |
| GET | `/api/payments` | List all payments |
| GET | `/api/payments/:id` | Get payment details |
| POST | `/api/payments/create` | Create payment |
| POST | `/api/payments/settle/:id` | Settle payment |
| POST | `/api/payments/refund/:id` | Refund payment |

## 🔐 Smart Contract Functions

| Function | Description |
|----------|-------------|
| `registerMerchant()` | Register caller as merchant |
| `createPayment(desc, orderId)` | Create payment request |
| `pay(paymentId)` | Pay for a payment (payable) |
| `settlePayment(paymentId)` | Release funds to merchant |
| `refundPayment(paymentId)` | Refund to customer |
| `cancelPayment(paymentId)` | Cancel unpaid payment |
| `getPayment(id)` | Get payment details |
| `getMerchantPayments(addr)` | Get merchant's payment IDs |
| `getMerchantEarnings(addr)` | Get merchant's total earnings |

## 🌐 Network Details

| | Testnet | Mainnet |
|---|---------|---------|
| Chain ID | 1983 | 1990 |
| RPC | rpc1testnet.qie.digital | rpc1mainnet.qie.digital |
| Explorer | testnet.qie.digital | mainnet.qie.digital |
| Token | QIE | QIEV3 |

## 📄 License

MIT

## 🙏 Built for QIE Blockchain Hackathon

Made with 💜 by [ulsreall](https://github.com/ulsreall)
