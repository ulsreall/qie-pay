     1|     1|# QIE Pay — Decentralized Payment Gateway + DeFi Protocol
     2|     2|
     3|     3|A full-stack crypto payment gateway and DeFi protocol built on **QIE Blockchain**. Accept QIE payments with low fees, instant settlement, smart escrow, and earn rewards — all on-chain.
     4|     4|
     5|     5|> 🏆 Built for the **QIE Blockchain Hackathon 2026** — DeFi & Payments Track
     6|     6|
     7|     7|---
     8|     8|
     9|     9|## ✨ Features
    10|    10|
    11|    11|### Payment Gateway
    12|    12|- **Dashboard** — Real-time revenue charts, payment tracking, sparkline trends, tabular-nums formatting
    13|    13|- **Create Payment** — Generate payment links with amount, description, order ID
    14|    14|- **Batch Payments** — Create multiple payments at once via CSV-style input
    15|    15|- **POS Mode** — Tablet-friendly Point of Sale for retail, preset amounts
    16|    16|- **Storefront** — Public merchant page with product listings and one-click checkout
    17|    17|- **Invoice Generator** — Downloadable HTML invoices with emerald branding
    18|    18|- **QR Codes** — Auto-generated QR for every payment link
    19|    19|- **CSV Export** — Export all transactions to CSV
    20|    20|- **Fee Calculator** — Instant fee calculation with QIE→USD conversion
    21|    21|- **Webhooks** — Real-time payment event notifications
    22|    22|- **API Docs** — Developer documentation with code snippets
    23|    23|- **Notifications** — Bell icon with unread count, 30s polling, toast on new payment
    24|    24|- **Merchant Settings** — Business name, description, category, logo upload, public profile
    25|    25|
    26|    26|### DeFi Protocol
    27|    27|- **Staking** — 4-tier fee system: stake QIE → lower platform fees (2.5% → 1.0%)
    28|    28|- **Governance** — Create proposals, vote for/against, quorum-based execution
    29|    29|- **QIEP Rewards** — ERC-20 token, earn 1 QIEP per QIE paid, burn 10 QIEP for 10% discount
    30|    30|- **On-Chain Faucet** — Decentralized testnet faucet, auto-funds new email wallets
    31|    31|
    32|    32|### Wallet & Auth
    33|    33|- **Wallet Connect** — QIE Wallet / MetaMask via `window.ethereum`
    34|    34|- **Email Wallet** — Create wallet with just an email address (deterministic key generation)
    35|    35|- **Auto-Faucet** — New email wallets auto-receive 2 QIE on creation
    36|    36|- **Demo Mode** — Explore full UI without wallet (mock data, amber indicator)
    37|    37|
    38|    38|### Technical
    39|    39|- **Code Splitting** — 20+ lazy-loaded chunks, vendor separation (React, ethers, charts, motion)
    40|    40|- **Mobile Responsive** — All 17+ pages adapt to mobile, tablet, desktop
    41|    41|- **True Gray UI** — Near-black `#09090B`, emerald accent `#10B981`, Stripe/Vercel-inspired
    42|    42|- **SVG Logo** — Custom emerald+sky gradient logo integrated throughout
    43|    43|
    44|    44|---
    45|    45|
    46|    46|## 🖼️ Screenshots
    47|    47|
    48|    48|| Landing Page | Dashboard | POS Mode |
    49|    49||:---:|:---:|:---:|
    50|    50|| ![Landing](./screenshots/ss-home.png) | ![Dashboard](./screenshots/ss-dashboard.png) | ![POS](./screenshots/ss-pos.png) |
    51|    51|
    52|    52|| Staking | Governance | Faucet |
    53|    53||:---:|:---:|:---:|
    54|    54|| ![Staking](./screenshots/ss-staking.png) | ![Governance](./screenshots/ss-governance.png) | ![Faucet](./screenshots/ss-faucet.png) |
    55|    55|
    56|    56|---
    57|    57|
    58|    58|## 🛠️ Tech Stack
    59|    59|
    60|    60|| Layer | Technology |
    61|    61||-------|-----------|
    62|    62|| **Frontend** | React 18, Vite, Tailwind CSS 3, Framer Motion |
    63|    63|| **Blockchain** | ethers.js v6, QIE Testnet (Chain ID 1983) |
    64|    64|| **Smart Contracts** | Solidity ^0.8.20, Hardhat |
    65|    65|| **UI** | Recharts, Lucide React, React Hot Toast, qrcode.react |
    66|    66|| **Backend** | Express.js, ethers.js (faucet API) |
    67|    67|| **Deploy** | Vercel (frontend), Hardhat (contracts) |
    68|    68|| **Design** | True gray system, 14px base, 6-8px radius, asymmetric layout |
    69|    69|
    70|    70|---
    71|    71|
    72|    72|## 📦 Smart Contracts
    73|    73|
    74|    74|All deployed on **QIE Testnet** (Chain ID 1983):
    75|    75|
    76|    76|| Contract | Address | Purpose |
    77|    77||----------|---------|---------|
    78|    78|| **QIEPay** | [`0xFFC670...BADD42`](https://testnet.qie.digital/address/0xFFC670DA0f40c1602175415abd9CEcd6d6BADD42) | Payment gateway — register, create, pay, settle, refund |
    79|    79|| **QIEStaking** | [`0x98D953...7140fC`](https://testnet.qie.digital/address/0x98D953BE697C730Ebc94e5d5032f68503f7140fC) | 4-tier staking for reduced fees |
    80|    80|| **QIEGovernance** | [`0xDBdDb2...1f4d74`](https://testnet.qie.digital/address/0xDBdDb269CcBd0EcE141c14E9eCaF695f2b1f4d74) | Proposal creation, voting, execution |
    81|    81|| **QIERewards** | [`0x56A140...DfaECa4`](https://testnet.qie.digital/address/0x56A140D3700aad23461605a3Cf7b9E880DfaECa4) | QIEP ERC-20 reward token |
    82|    82|| **QIEFaucet** | [`0xe0BC1D...95E1E2a6`](https://testnet.qie.digital/address/0xe0BC1D6CC58E091F6A2866788D7D938895E1E2a6) | Decentralized testnet faucet (109.5 QIE funded) |
    83|    83|
    84|    84|### QIEPay Functions
    85|    85|```solidity
    86|    86|registerMerchant()                              // Register as merchant
    87|    87|createPayment(description, orderId, amountInQIE) // Create payment request
    88|    88|pay(paymentId)                                  // Pay (payable, sends QIE)
    89|    89|settlePayment(paymentId)                        // Merchant settles (minus 2.5% fee)
    90|    90|refundPayment(paymentId)                        // Merchant refunds
    91|    91|cancelPayment(paymentId)                        // Merchant cancels
    92|    92|```
    93|    93|
    94|    94|### QIEStaking Tiers
    95|    95|| Stake | Fee Rate | Savings |
    96|    96||-------|----------|---------|
    97|    97|| 0 QIE | 2.5% | — |
    98|    98|| 100 QIE | 2.0% | 20% |
    99|    99|| 500 QIE | 1.5% | 40% |
   100|   100|| 1000 QIE | 1.0% | 60% |
   101|   101|
   102|   102|### QIEP Rewards
   103|   103|- Earn 1 QIEP per 1 QIE settled
   104|   104|- Burn 10 QIEP for 10% fee discount
   105|   105|- Add QIEP to wallet via `wallet_watchAsset`
   106|   106|
   107|   107|---
   108|   108|
   109|   109|## 🚀 Getting Started
   110|   110|
   111|   111|### Prerequisites
   112|   112|- Node.js 18+
   113|   113|- QIE Wallet or MetaMask (configured for QIE Testnet)
   114|   114|- OR just an email address (email wallet auto-created)
   115|   115|
   116|   116|### Installation
   117|   117|
   118|   118|```bash
   119|   119|# Clone
   120|   120|git clone https://github.com/ulsreall/qie-pay.git
   121|   121|cd qie-pay
   122|   122|
   123|   123|# Frontend
   124|   124|cd frontend
   125|   125|npm install
   126|   126|npm run dev
   127|   127|
   128|   128|# Backend (optional — for faucet API)
   129|   129|cd ../backend
   130|   130|npm install
   131|   131|cp .env.example .env  # set PRIVATE_KEY + CONTRACT_ADDRESS
   132|   132|node server.js
   133|   133|```
   134|   134|
   135|   135|### Network Configuration
   136|   136|| Key | Value |
   137|   137||-----|-------|
   138|   138|| Chain ID | 1983 |
   139|   139|| RPC URL | `https://rpc1testnet.qie.digital/` |
   140|   140|| Explorer | `https://testnet.qie.digital` |
   141|   141|| Currency | QIE |
   142|   142|
   143|   143|---
   144|   144|
   145|   145|## 📁 Project Structure
   146|   146|
   147|   147|```
   148|   148|qie-pay/
   149|   149|├── contracts/
   150|   150|│   ├── QIEPay.sol            # Payment gateway contract
   151|   151|│   ├── QIEStaking.sol        # 4-tier staking contract
   152|   152|│   ├── QIEGovernance.sol     # Governance + voting
   153|   153|│   ├── QIERewards.sol        # QIEP ERC-20 token
   154|   154|│   ├── QIEFaucet.sol         # Testnet faucet
   155|   155|│   └── scripts/              # Deploy scripts
   156|   156|├── frontend/
   157|   157|│   ├── public/               # Logos, favicons, assets
   158|   158|│   ├── src/
   159|   159|│   │   ├── components/       # Sidebar, WalletConnect, Notifications, Layout
   160|   160|│   │   ├── context/          # DemoContext (demo mode state)
   161|   161|│   │   ├── pages/            # 17+ route pages
   162|   162|│   │   ├── utils/            # contract.js, email-wallet.jsx, currency, export
   163|   163|│   │   ├── App.jsx           # Router + lazy loading
   164|   164|│   │   └── index.css         # Design system
   165|   165|│   ├── tailwind.config.js
   166|   166|│   └── vite.config.js        # Code splitting (20+ chunks)
   167|   167|├── backend/
   168|   168|│   ├── server.js             # Express API
   169|   169|│   ├── routes/
   170|   170|│   │   ├── payments.js       # Payment CRUD
   171|   171|│   │   ├── merchants.js      # Merchant management
   172|   172|│   │   └── faucet.js         # Faucet drip API
   173|   173|│   └── config.js             # RPC, contract, chain config
   174|   174|├── hardhat.config.js         # QIE Testnet + Mainnet config
   175|   175|└── README.md
   176|   176|```
   177|   177|
   178|   178|---
   179|   179|
   180|   180|## 🏗️ Architecture
   181|   181|
   182|   182|```
   183|   183|┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
   184|   184|│   Customer   │────▶│  Payment Page │────▶│  QIEPay Contract │
   185|   185|│  (Browser)   │     │  /pay/:id     │     │  (QIE Testnet)   │
   186|   186|└─────────────┘     └──────────────┘     └─────────────────┘
   187|   187|       │                    │                       │
   188|   188|       │              ┌─────┴─────┐          ┌──────┴──────┐
   189|   189|       │              │  QR Code   │          │  Escrow     │
   190|   190|       │              │  Invoice   │          │  Settlement │
   191|   191|       │              └────────────┘          │  2.5% Fee   │
   192|   192|       │                                      └──────┬──────┘
   193|   193|       │                                             │
   194|   194|       ▼                                      ┌──────▼──────┐
   195|   195|┌─────────────┐     ┌──────────────┐         │ QIEP Rewards │
   196|   196|│  Email Wallet│────▶│   Faucet     │────────▶│  ERC-20 Mint │
   197|   197|│  (No wallet?)│     │  2 QIE      │         └──────────────┘
   198|   198|└─────────────┘     └──────────────┘
   199|   199|
   200|   200|┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
   201|   201|│   Merchant   │────▶│  Dashboard   │────▶│  Notifications   │
   202|   202|│  (Browser)   │     │  Analytics   │     │  Webhooks        │
   203|   203|│              │     │  POS/Store   │     │  API Docs        │
   204|   204|└─────────────┘     └──────────────┘     └─────────────────┘
   205|   205|       │
   206|   206|       ▼
   207|   207|┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
   208|   208|│   Staking    │────▶│  Lower Fees  │     │   Governance     │
   209|   209|│  100-1000 QIE│     │  2.5%→1.0%  │     │  Vote on Props   │
   210|   210|└─────────────┘     └──────────────┘     └─────────────────┘
   211|   211|```
   212|   212|
   213|   213|---
   214|   214|
   215|   215|## 🔗 Links
   216|   216|
   217|   217|- **Live Demo:** [qie-pay.vercel.app](https://qie-pay.vercel.app/)
   218|   218|- **GitHub:** [ulsreall/qie-pay](https://github.com/ulsreall/qie-pay)
   219|   219|- **QIE Explorer:** [testnet.qie.digital](https://testnet.qie.digital)
   220|   220|
   221|   221|---
   222|   222|
   223|   223|## 📄 License
   224|   224|
   225|   225|MIT License — Built for QIE Blockchain Hackathon 2026
   226|   226|