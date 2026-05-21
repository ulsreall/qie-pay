import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Copy, Check, ExternalLink, ArrowRight, Blocks, Globe, FileCode, Layers, Network } from 'lucide-react';
import toast from 'react-hot-toast';

const CONTRACT_ADDRESS = '0xFFC670DA0f40c1602175415abd9CEcd6d6BADD42';

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
    </button>
  );
}

function CodeBlock({ code, language = 'javascript' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors z-10">
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
      </button>
      <pre className="bg-black/40 border border-white/5 rounded-xl p-4 overflow-x-auto text-sm font-mono text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const CONTRACT_FUNCTIONS = [
  { sig: 'registerMerchant()', params: 'none', desc: 'Register the caller as a merchant on the platform', example: 'await pay.registerMerchant()' },
  { sig: 'createPayment(description, orderId, amountInQIE)', params: 'string description, string orderId, uint256 amountInQIE', desc: 'Create a new payment request. Amount is in QIE smallest unit.', example: 'await pay.createPayment("Coffee", "ORD-1", ethers.parseEther("0.2"))' },
  { sig: 'pay(paymentId)', params: 'uint256 paymentId', desc: 'Pay for an existing payment request. Must send exact QIE amount.', example: 'await pay.pay(1, { value: ethers.parseEther("0.2") })' },
  { sig: 'settlePayment(paymentId)', params: 'uint256 paymentId', desc: 'Settle a paid payment (merchant only). Releases funds to merchant.', example: 'await pay.settlePayment(1)' },
  { sig: 'refundPayment(paymentId)', params: 'uint256 paymentId', desc: 'Refund a paid payment back to the customer (merchant only)', example: 'await pay.refundPayment(1)' },
  { sig: 'cancelPayment(paymentId)', params: 'uint256 paymentId', desc: 'Cancel an unpaid payment request (merchant only)', example: 'await pay.cancelPayment(1)' },
];

const FLOW_STEPS = ['Merchant', 'Create Payment', 'Share Link', 'Customer Pays', 'Escrow', 'Settle', 'Funds Released'];

const NETWORK_INFO = [
  { label: 'Chain ID', value: '1983' },
  { label: 'RPC URL', value: 'https://rpc.qie.io' },
  { label: 'Explorer', value: 'https://explorer.qie.io' },
  { label: 'Contract', value: CONTRACT_ADDRESS },
];

export default function Developers() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center"><Code2 className="text-purple-400" size={22} /></div>
          <h1 className="text-2xl font-bold text-white">Developer API</h1>
        </div>
        <p className="text-gray-400 ml-[52px]">Integrate QIE Pay into your application. Follow our guides and use the SDK to start accepting crypto payments.</p>
      </div>

      {/* Quick Start */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><FileCode size={18} className="text-purple-400" /> Quick Start</h2>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">1</span>
              <span className="text-white font-medium">Install the SDK</span>
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Conceptual</span>
            </div>
            <CodeBlock code="npm install @qiepay/sdk" language="bash" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">2</span>
              <span className="text-white font-medium">Initialize</span>
            </div>
            <CodeBlock code={`import { QiePay } from '@qiepay/sdk';\n\nconst pay = new QiePay({\n  chainId: 1983,\n  contract: '${CONTRACT_ADDRESS}'\n});`} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">3</span>
              <span className="text-white font-medium">Create a Payment</span>
            </div>
            <CodeBlock code={`const payment = await pay.create({\n  description: 'Order #123',\n  amount: '0.5', // QIE\n  orderId: 'ORD-123'\n});\n\n// Returns: { paymentId, paymentUrl, qrCode }`} />
          </div>
        </div>
      </div>

      {/* Smart Contract Interface */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Blocks size={18} className="text-purple-400" /> Smart Contract Interface</h2>
        <div className="space-y-3">
          {CONTRACT_FUNCTIONS.map((fn, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
              <code className="text-sm font-mono text-purple-300">{fn.sig}</code>
              <p className="text-xs text-gray-400 mt-1">{fn.desc}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="text-gray-500">Params: <span className="text-gray-400">{fn.params}</span></span>
              </div>
              <div className="mt-2 bg-black/30 rounded-lg px-3 py-2">
                <code className="text-xs font-mono text-emerald-400">{fn.example}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Contract Interaction */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Code2 size={18} className="text-purple-400" /> Direct Contract Interaction</h2>
        <p className="text-sm text-gray-400">Interact directly with the smart contract using ethers.js. Use <code className="text-purple-300">eth_sendTransaction</code> for QIE Wallet compatibility.</p>
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
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Layers size={18} className="text-purple-400" /> Embed Widget</h2>
        <p className="text-sm text-gray-400">Embed the QIE Pay widget directly into your website with an iframe.</p>
        <CodeBlock code={`<iframe\n  src="https://qie-pay.vercel.app/widget/YOUR_ADDRESS"\n  width="400"\n  height="600"\n  frameborder="0"\n></iframe>`} language="html" />
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2">Preview:</p>
          <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
            <div className="w-full max-w-xs mx-auto aspect-[2/3] rounded-xl bg-black/30 border border-white/5 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 font-bold text-sm">QIE</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-white font-medium">QIE Pay Widget</p>
                <p className="text-xs text-gray-500">Pay 0.2000 QIE</p>
              </div>
              <div className="w-24 h-24 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-xs text-gray-600">QR Code</span>
              </div>
              <div className="w-32 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center">
                <span className="text-xs text-purple-300">Connect Wallet</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Flow */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><ArrowRight size={18} className="text-purple-400" /> Payment Flow</h2>
        <div className="flex flex-wrap items-center justify-center gap-2 py-4">
          {FLOW_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                i === 0 ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' :
                i === FLOW_STEPS.length - 1 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' :
                'bg-white/5 border-white/10 text-gray-300'
              }`}>
                {step}
              </span>
              {i < FLOW_STEPS.length - 1 && <ArrowRight size={16} className="text-gray-600" />}
            </div>
          ))}
        </div>
      </div>

      {/* Network Info */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Network size={18} className="text-purple-400" /> Network Information</h2>
        <div className="space-y-2">
          {NETWORK_INFO.map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
              <div>
                <span className="text-xs text-gray-500">{item.label}</span>
                <p className="text-sm text-gray-200 font-mono">{item.value}</p>
              </div>
              <CopyBtn text={item.value} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
