import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, DollarSign, Shield, Wallet, QrCode, Layers, BarChart3,
  ArrowRight, Globe, Code2, Database, Cpu,
  Monitor, Store, Webhook, FileText
} from 'lucide-react';

/* ─── Features Data (trimmed to 9 for 3-col grid) ─── */
const features = [
  { icon: Zap, title: 'Instant Settlement', desc: 'Funds settle directly on-chain in seconds — no waiting for bank transfers.' },
  { icon: DollarSign, title: 'Low Fees', desc: 'Only 2.5% platform fee — far below traditional payment processors.' },
  { icon: Shield, title: 'Smart Escrow', desc: 'Payments held in a trustless smart contract until settlement.' },
  { icon: Wallet, title: 'Multi-Wallet', desc: 'Works with QIE Wallet, MetaMask, and any WalletConnect-compatible wallet.' },
  { icon: Monitor, title: 'POS Mode', desc: 'Tablet-friendly Point of Sale interface for in-store retail payments.' },
  { icon: Store, title: 'Storefront', desc: 'Public merchant page with product listings and direct payment links.' },
  { icon: Layers, title: 'Batch Processing', desc: 'Create and settle multiple payments at once for high-volume merchants.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Real-time revenue charts, payment tracking, and performance metrics.' },
  { icon: QrCode, title: 'QR Payments', desc: 'Generate QR codes for each invoice — customers scan and pay instantly.' },
];

const steps = [
  { num: 1, title: 'Connect', desc: 'Connect your wallet to QIE Blockchain.' },
  { num: 2, title: 'Create', desc: 'Create a payment request with amount and description.' },
  { num: 3, title: 'Get Paid', desc: 'Share the link or QR code. Funds arrive instantly.' },
];

const techStack = [
  { icon: Globe, name: 'QIE Blockchain', desc: 'Layer 1 EVM-compatible chain with 30K TPS' },
  { icon: Code2, name: 'Solidity Contracts', desc: 'Audited smart contract on-chain escrow' },
  { icon: Cpu, name: 'React + Tailwind', desc: 'Modern UI with clean fintech design' },
  { icon: Database, name: 'ethers.js v6', desc: 'Direct blockchain interaction via JSON-RPC' },
];

/* ─── Animated Counter ─── */
function AnimatedCounter({ end, suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = end / 40;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, duration / 40);
    return () => clearInterval(timer);
  }, [end]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Page ─── */
export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#27272A] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span className="text-xs text-[#A1A1AA]">Live on QIE Testnet — Chain ID 1983</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4 text-[#FAFAFA] tracking-tight"
          >
            Accept{' '}
            <span className="text-[#10B981]">Crypto Payments</span>
            <br />With Ease
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm text-[#A1A1AA] max-w-xl mx-auto mb-8 leading-relaxed"
          >
            QIE Pay is a full-stack decentralized payment gateway built on the QIE Blockchain.
            Accept payments with POS mode, storefronts, webhooks, and developer APIs — all on-chain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              to="/create"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md text-sm transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pos"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-[#3F3F46] hover:border-[#52525B] text-[#A1A1AA] font-medium rounded-md text-sm transition-colors"
            >
              Try POS Mode
              <Monitor className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar (4 stats) ─── */}
      <section className="py-8 px-4 border-y border-[#1E1E21] bg-[#09090B]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { value: 30000, suffix: '+', label: 'TPS' },
            { value: 2, suffix: '.5%', label: 'Platform Fee' },
            { value: 1983, suffix: '', label: 'Chain ID' },
            { value: 100, suffix: '%', label: 'On-Chain' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-xl font-semibold text-[#10B981]">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-xs text-[#71717A] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid (3-column) ─── */}
      <section className="py-16 px-4" id="features">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#10B981] font-medium text-xs uppercase tracking-widest mb-2">
              Features
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#FAFAFA] tracking-tight">
              Everything You Need to Accept Crypto
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.15 }}
                className="bg-[#111113] border border-[#27272A] rounded-md p-4 hover:border-[#3F3F46] transition-colors"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-md bg-[rgba(16,185,129,0.1)] flex items-center justify-center shrink-0">
                    <feat.icon className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <h3 className="font-medium text-sm text-[#FAFAFA]">{feat.title}</h3>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works (horizontal with arrows) ─── */}
      <section className="py-16 px-4 bg-[#09090B]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#10B981] font-medium text-xs uppercase tracking-widest mb-2">How It Works</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#FAFAFA] tracking-tight">Start in Three Simple Steps</h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-center gap-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.15 }}
                  className="text-center flex-shrink-0"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#10B981] flex items-center justify-center text-lg font-bold text-white">
                    {step.num}
                  </div>
                  <h3 className="text-sm font-semibold text-[#FAFAFA] mb-1">{step.title}</h3>
                  <p className="text-xs text-[#A1A1AA] max-w-[160px]">{step.desc}</p>
                </motion.div>
                {i < steps.length - 1 && (
                  <span className="text-[#52525B] text-xl font-light mx-4 hidden md:block">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tech Stack (2-column) ─── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#10B981] font-medium text-xs uppercase tracking-widest mb-2">Technology</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#FAFAFA] tracking-tight">Built on Proven Tech</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {techStack.map((tech) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.15 }}
                className="bg-[#111113] border border-[#27272A] rounded-md p-4 hover:border-[#3F3F46] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <tech.icon className="w-5 h-5 text-[#10B981] shrink-0" />
                  <div>
                    <h3 className="font-medium text-sm text-[#FAFAFA]">{tech.name}</h3>
                    <p className="text-xs text-[#71717A]">{tech.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section (no gradient) ─── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-[#10B981] rounded-lg p-5 sm:p-8 md:p-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">Start Accepting Payments Today</h2>
            <p className="text-[#D1FAE5] text-sm mb-6 max-w-md mx-auto">
              Join the decentralized payment revolution. POS mode, storefronts, webhooks, and developer APIs — everything you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#047857] font-medium rounded-md text-sm hover:bg-[#ECFDF5] transition-colors"
              >
                Create Your First Payment
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/developers"
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#6EE7B7] text-white font-medium rounded-md text-sm hover:bg-[#059669] transition-colors"
              >
                View API Docs
                <Code2 className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#1E1E21] py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#10B981] flex items-center justify-center">
              <span className="text-white font-bold text-xs">Q</span>
            </div>
            <span className="text-sm font-semibold text-[#FAFAFA]">QIE<span className="text-[#10B981]">Pay</span></span>
          </div>
          <p className="text-xs text-[#71717A]">
            Built for QIE Blockchain Hackathon 2026
          </p>
          <div className="flex items-center gap-4">
            <a href="https://explorer.qie.io" target="_blank" rel="noopener noreferrer" className="text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors">
              Explorer
            </a>
            <a href="https://rpc.qie.io" target="_blank" rel="noopener noreferrer" className="text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors">
              RPC
            </a>
            <Link to="/developers" className="text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors">
              API Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
