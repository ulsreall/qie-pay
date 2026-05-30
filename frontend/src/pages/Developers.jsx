import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code2, Copy, Check, Blocks, Globe,
  FileCode, Layers, Network, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESS, EXPLORER_URL, CHAIN_ID, CHAIN_NAME, RPC_URL } from '../utils/constants';

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-md bg-[#18181B] hover:bg-[#27272A] transition-colors"
    >
      {copied ? <Check size={12} className="text-[#34D399]" /> : <Copy size={12} className="text-[#A1A1AA]" />}
    </button>
  );
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 rounded-md bg-[#18181B] hover:bg-[#27272A] transition-colors z-10"
      >
        {copied ? <Check size={12} className="text-[#34D399]" /> : <Copy size={12} className="text-[#A1A1AA]" />}
      </button>
      <pre className="bg-[#09090B] rounded-md p-3 overflow-x-auto text-xs font-mono text-[#A1A1AA]">
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
    params: 'string, string, uint256',
    desc: 'Create a new payment request. Amount is in QIE smallest unit.',
    example: 'await pay.createPayment("Coffee", "ORD-1", ethers.parseEther("0.2"))',
  },
  {
    sig: 'pay(paymentId)',
    params: 'uint256',
    desc: 'Pay for an existing payment request. Must send exact QIE amount.',
    example: 'await pay.pay(1, { value: ethers.parseEther("0.2") })',
  },
  {
    sig: 'settlePayment(paymentId)',
    params: 'uint256',
    desc: 'Settle a paid payment (merchant only). Releases funds to merchant.',
    example: 'await pay.settlePayment(1)',
  },
  {
    sig: 'refundPayment(paymentId)',
    params: 'uint256',
    desc: 'Refund a paid payment back to the customer (merchant only)',
    example: 'await pay.refundPayment(1)',
  },
  {
    sig: 'cancelPayment(paymentId)',
    params: 'uint256',
    desc: 'Cancel an unpaid payment request (merchant only)',
    example: 'await pay.cancelPayment(1)',
  },
];

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-[#FAFAFA] flex items-center gap-2 tracking-tight">
            <Code2 size={16} className="text-[#34D399]" />
            Developer API
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5 ml-6">
            Integrate QIE Pay into your application. Follow our guides and use the SDK to start accepting crypto payments.
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#A1A1AA] flex items-center gap-1.5">
            <FileCode size={14} className="text-[#34D399]" /> Quick Start
          </h2>

          <div className="space-y-4">
            {/* Step 1 */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#10B981] text-white text-[10px] flex items-center justify-center font-bold">1</span>
                <span className="text-xs text-[#A1A1AA] font-medium">Install the SDK</span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Conceptual</span>
              </div>
              <CodeBlock code="npm install @qiepay/sdk" />
            </div>

            {/* Step 2 */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#10B981] text-white text-[10px] flex items-center justify-center font-bold">2</span>
                <span className="text-xs text-[#A1A1AA] font-medium">Initialize</span>
              </div>
              <CodeBlock code={`import { QiePay } from '@qiepay/sdk';\n\nconst pay = new QiePay({\n  chainId: ${CHAIN_ID},\n  contract: '${CONTRACT_ADDRESS}'\n});`} />
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-[#10B981] text-white text-[10px] flex items-center justify-center font-bold">3</span>
                <span className="text-xs text-[#A1A1AA] font-medium">Create a Payment</span>
              </div>
              <CodeBlock code={`const payment = await pay.create({\n  description: 'Order #123',\n  amount: '0.5', // QIE\n  orderId: 'ORD-123'\n});\n\n// Returns: { paymentId, paymentUrl, qrCode }`} />
            </div>
          </div>
        </div>

        {/* Smart Contract Interface */}
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#A1A1AA] flex items-center gap-1.5">
            <Blocks size={14} className="text-[#34D399]" /> Smart Contract Interface
          </h2>
          <div className="space-y-2">
            {CONTRACT_FUNCTIONS.map((fn, i) => (
              <div key={i} className="bg-[#09090B] rounded-md p-3 border border-[#27272A]">
                <code className="text-xs font-mono text-[#34D399]">{fn.sig}</code>
                <p className="text-xs text-[#A1A1AA] mt-0.5">{fn.desc}</p>
                <div className="mt-1 text-xs">
                  <span className="text-[#71717A]">Params: <span className="text-[#A1A1AA]">{fn.params}</span></span>
                </div>
                <div className="mt-1.5 bg-[#111113] rounded-md px-2.5 py-1.5">
                  <code className="text-[11px] font-mono text-[#34D399]">{fn.example}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Direct Contract Interaction */}
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#A1A1AA] flex items-center gap-1.5">
            <Code2 size={14} className="text-[#34D399]" /> Direct Contract Interaction
          </h2>
          <p className="text-xs text-[#A1A1AA]">
            Interact directly with the smart contract using ethers.js. Use <code className="text-[#34D399] bg-[rgba(16,185,129,0.1)] px-1 py-0.5 rounded text-[10px]">eth_sendTransaction</code> for QIE Wallet compatibility.
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
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#A1A1AA] flex items-center gap-1.5">
            <Layers size={14} className="text-[#34D399]" /> Embed Widget
          </h2>
          <p className="text-xs text-[#A1A1AA]">
            Embed the QIE Pay widget directly into your website with an iframe.
          </p>
          <CodeBlock code={`<iframe\n  src="${window.location.origin || 'https://qie-pay.vercel.app'}/widget/YOUR_ADDRESS"\n  width="400"\n  height="600"\n  frameborder="0"\n></iframe>`} />
          <div className="mt-3">
            <p className="text-xs text-[#71717A] mb-1.5">Preview:</p>
            <div className="bg-[#09090B] rounded-md border border-[#27272A] p-4 text-center">
              <div className="w-full max-w-xs mx-auto aspect-[2/3] rounded-lg bg-[#111113] border border-[#27272A] flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-md bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
                  <Zap size={16} className="text-[#10B981]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-[#A1A1AA] font-medium">QIE Pay Widget</p>
                  <p className="text-[10px] text-[#71717A]">Pay 0.2000 QIE</p>
                </div>
                <div className="w-20 h-20 rounded-md bg-[#18181B] border border-[#3F3F46] flex items-center justify-center">
                  <span className="text-[10px] text-[#71717A]">QR Code</span>
                </div>
                <div className="w-28 h-7 rounded-md bg-[#10B981] flex items-center justify-center">
                  <span className="text-[10px] text-white font-medium">Connect Wallet</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#A1A1AA] flex items-center gap-1.5">
            <Network size={14} className="text-[#34D399]" /> Network Information
          </h2>
          <div className="space-y-1.5">
            {NETWORK_INFO.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#09090B] rounded-md px-3 py-2.5 border border-[#27272A]"
              >
                <div>
                  <span className="text-[10px] text-[#71717A]">{item.label}</span>
                  <p className="text-xs text-[#A1A1AA] font-mono break-all">{item.value}</p>
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
