import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code2, Copy, Check, ExternalLink, ArrowRight, Blocks, Globe,
  FileCode, Layers, Network, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESS, EXPLORER_URL, CHAIN_ID, CHAIN_NAME, RPC_URL } from '../utils/constants';

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
    </button>
  );
}

function CodeBlock({ code, language = 'javascript' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors z-10"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
      </button>
      <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const CONTRACT_FUNCTIONS = [
  {
    sig: 'registerMerchant()',
    params: 'none',
    desc: 'Register the caller as a merchant on the platform',
    example: 'await pay.registerMerchant()',
  },
  {
    sig: 'createPayment(description, orderId, amountInQIE)',
    params: 'string description, string orderId, uint256 amountInQIE',
    desc: 'Create a new payment request. Amount is in QIE smallest unit.',
    example: 'await pay.createPayment("Coffee", "ORD-1", ethers.parseEther("0.2"))',
  },
  {
    sig: 'pay(paymentId)',
    params: 'uint256 paymentId',
    desc: 'Pay for an existing payment request. Must send exact QIE amount.',
    example: 'await pay.pay(1, { value: ethers.parseEther("0.2") })',
  },
  {
    sig: 'settlePayment(paymentId)',
    params: 'uint256 paymentId',
    desc: 'Settle a paid payment (merchant only). Releases funds to merchant.',
    example: 'await pay.settlePayment(1)',
  },
  {
    sig: 'refundPayment(paymentId)',
    params: 'uint256 paymentId',
    desc: 'Refund a paid payment back to the customer (merchant only)',
    example: 'await pay.refundPayment(1)',
  },
  {
    sig: 'cancelPayment(paymentId)',
    params: 'uint256 paymentId',
    desc: 'Cancel an unpaid payment request (merchant only)',
    example: 'await pay.cancelPayment(1)',
  },
];

const FLOW_STEPS = ['Merchant', 'Create Payment', 'Share Link', 'Customer Pays', 'Escrow', 'Settle', 'Funds Released'];

const NETWORK_INFO = [
  { label: 'Chain ID', value: CHAIN_ID.toString() },
  { label: 'Network', value: CHAIN_NAME },
  { label: 'RPC URL', value: RPC_URL },
  { label: 'Explorer', value: EXPLORER_URL },
  { label: 'Contract', value: CONTRACT_ADDRESS },
];

export default function Developers() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 lg:p-8"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Code2 size={18} className="text-emerald-500" />
            </div>
            Developer API
          </h1>
          <p className="text-slate-400 text-sm mt-2 ml-12">
            Integrate QIE Pay into your application. Follow our guides and use the SDK to start accepting crypto payments.
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
            <FileCode size={18} className="text-emerald-500" /> Quick Start
          </h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                <span className="text-slate-50 font-medium">Install the SDK</span>
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Conceptual</span>
              </div>
              <CodeBlock code="npm install @qiepay/sdk" language="bash" />
            </div>

            {/* Step 2 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                <span className="text-slate-50 font-medium">Initialize</span>
              </div>
              <CodeBlock code={`import { QiePay } from '@qiepay/sdk';\n\nconst pay = new QiePay({\n  chainId: ${CHAIN_ID},\n  contract: '${CONTRACT_ADDRESS}'\n});`} />
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                <span className="text-slate-50 font-medium">Create a Payment</span>
              </div>
              <CodeBlock code={`const payment = await pay.create({\n  description: 'Order #123',\n  amount: '0.5', // QIE\n  orderId: 'ORD-123'\n});\n\n// Returns: { paymentId, paymentUrl, qrCode }`} />
            </div>
          </div>
        </div>

        {/* Smart Contract Interface */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
            <Blocks size={18} className="text-emerald-500" /> Smart Contract Interface
          </h2>
          <div className="space-y-3">
            {CONTRACT_FUNCTIONS.map((fn, i) => (
              <div key={i} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <code className="text-sm font-mono text-emerald-400">{fn.sig}</code>
                <p className="text-xs text-slate-400 mt-1">{fn.desc}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="text-slate-500">Params: <span className="text-slate-400">{fn.params}</span></span>
                </div>
                <div className="mt-2 bg-slate-800 rounded-lg px-3 py-2">
                  <code className="text-xs font-mono text-emerald-400">{fn.example}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Direct Contract Interaction */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
            <Code2 size={18} className="text-emerald-500" /> Direct Contract Interaction
          </h2>
          <p className="text-sm text-slate-400">
            Interact directly with the smart contract using ethers.js. Use <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs">eth_sendTransaction</code> for QIE Wallet compatibility.
          </p>
          <CodeBlock code={`import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const iface = new ethers.Interface(ABI);

// Create payment
const data = iface.encodeFunctionData('createPayment', [
  'Coffee',
  'ORD-1',
  ethers.parseEther('0.2')
]);

const tx = await signer.sendTransaction({
  to: '${CONTRACT_ADDRESS}',
  data
});

await tx.wait();`} />
        </div>

        {/* Embed Widget */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
            <Layers size={18} className="text-emerald-500" /> Embed Widget
          </h2>
          <p className="text-sm text-slate-400">
            Embed the QIE Pay widget directly into your website with an iframe.
          </p>
          <CodeBlock code={`<iframe\n  src="${window.location.origin || 'https://qie-pay.vercel.app'}/widget/YOUR_ADDRESS"\n  width="400"\n  height="600"\n  frameborder="0"\n></iframe>`} language="html" />
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-2">Preview:</p>
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 text-center">
              <div className="w-full max-w-xs mx-auto aspect-[2/3] rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Zap size={20} className="text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-50 font-medium">QIE Pay Widget</p>
                  <p className="text-xs text-slate-500">Pay 0.2000 QIE</p>
                </div>
                <div className="w-24 h-24 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center">
                  <span className="text-xs text-slate-500">QR Code</span>
                </div>
                <div className="w-32 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <span className="text-xs text-white font-medium">Connect Wallet</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Flow */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
            <ArrowRight size={18} className="text-emerald-500" /> Payment Flow
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 py-4">
            {FLOW_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                  i === 0
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : i === FLOW_STEPS.length - 1
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}>
                  {step}
                </span>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight size={16} className="text-slate-600" />
                )}
              </div>
            ))}
          </div>
          <div className="bg-slate-900 rounded-lg p-4 mt-2">
            <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap">
{`Merchant creates payment request
        ↓
Payment link/QR shared with customer
        ↓
Customer sends QIE to contract (escrow)
        ↓
Funds held in smart contract
        ↓
Merchant settles → funds released minus 2.5% fee`}
            </pre>
          </div>
        </div>

        {/* Network Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
            <Network size={18} className="text-emerald-500" /> Network Information
          </h2>
          <div className="space-y-2">
            {NETWORK_INFO.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-900 rounded-lg px-4 py-3 border border-slate-700"
              >
                <div>
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <p className="text-sm text-slate-200 font-mono break-all">{item.value}</p>
                </div>
                <CopyBtn text={item.value} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
