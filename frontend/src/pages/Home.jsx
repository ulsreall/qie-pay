import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, DollarSign, Shield, Wallet, QrCode, Layers, BarChart3, Link2,
  ArrowRight, ChevronRight, Globe, Code2, Database, Cpu,
  Monitor, Store, Webhook, FileText
} from 'lucide-react';

/* ─── Features Data ─── */
const features = [
  { icon: Zap, title: 'Instant Settlement', desc: 'Funds settle directly on-chain in seconds — no waiting for bank transfers.' },
  { icon: DollarSign, title: 'Low Fees', desc: 'Only 2.5% platform fee — far below traditional payment processors.' },
  { icon: Shield, title: 'Smart Escrow', desc: 'Payments held in a trustless smart contract until settlement.' },
  { icon: Wallet, title: 'Multi-Wallet Support', desc: 'Works with QIE Wallet, MetaMask, and any WalletConnect-compatible wallet.' },
  { icon: Monitor, title: 'POS Mode', desc: 'Tablet-friendly Point of Sale interface for in-store retail payments.' },
  { icon: Store, title: 'Storefront', desc: 'Public merchant page with product listings and direct payment links.' },
  { icon: Layers, title: 'Batch Processing', desc: 'Create and settle multiple payments at once for high-volume merchants.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time revenue charts, payment tracking, and performance metrics.' },
  { icon: QrCode, title: 'QR Payments', desc: 'Generate QR codes for each invoice — customers scan and pay instantly.' },
  { icon: Webhook, title: 'Webhook Integration', desc: 'Real-time notifications to your server when payment events occur.' },
  { icon: FileText, title: 'Invoice Generator', desc: 'Professional downloadable invoices with QIEPay branding for every payment.' },
  { icon: Code2, title: 'Developer API', desc: 'Full SDK and documentation for seamless integration into your app.' },
];

const steps = [
  { num: 1, title: 'Connect', desc: 'Connect your wallet to QIE Blockchain. Supports QIE Wallet, MetaMask, and more.' },
  { num: 2, title: 'Create', desc: 'Create a payment request with amount, description, and optional order ID.' },
  { num: 3, title: 'Get Paid', desc: 'Share the payment link or QR code. Funds arrive in your wallet instantly.' },
];

const techStack = [
  { icon: Globe, name: 'QIE Blockchain', desc: 'Layer 1 EVM-compatible chain with 30K TPS' },
  { icon: Code2, name: 'Solidity Contracts', desc: 'Audited smart contract on-chain escrow' },
  { icon: Cpu, name: 'React + Tailwind', desc: 'Modern UI with clean fintech design' },
  { icon: Database, name: 'ethers.js v6', desc: 'Direct blockchain interaction via JSON-RPC' },
];

/* ─── Animated Counter ─── */
function AnimatedCounter({ end, suffix = '', prefix = '' }) {
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

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ─── Page ─── */
export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-400">Live on QIE Testnet — Chain ID 1983</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-slate-50"
          >
            Accept{' '}
            <span className="text-emerald-500">Crypto Payments</span>
            <br />With Ease
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            QIE Pay is a full-stack decentralized payment gateway built on the QIE Blockchain.
            Accept payments with POS mode, storefronts, webhooks, and developer APIs — all on-chain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/create"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/pos"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium rounded-lg transition-colors"
            >
              Try POS Mode
              <Monitor className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="py-10 px-4 border-y border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          {[
            { value: 12, suffix: '+', label: 'Features' },
            { value: 30000, suffix: '+', label: 'TPS' },
            { value: 2, suffix: '.5%', label: 'Platform Fee' },
            { value: 1983, suffix: '', label: 'Chain ID' },
            { value: 100, suffix: '%', label: 'On-Chain' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-emerald-500">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="py-24 px-4" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-500 font-medium text-sm uppercase tracking-widest mb-3">
              Features
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">
              Everything You Need to Accept Crypto
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Built for merchants who want fast, secure, and transparent payment processing on the QIE Blockchain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feat) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4 }}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                  <feat.icon className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-slate-50 mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-500 font-medium text-sm uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50">Start in Three Simple Steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="text-center relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-slate-700" />
                )}
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-500 flex items-center justify-center text-2xl font-bold text-white">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-slate-50 mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tech Stack ─── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-500 font-medium text-sm uppercase tracking-widest mb-3">Technology</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50">Built on Proven Tech</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {techStack.map((tech) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="bg-slate-800 border border-slate-700 rounded-xl p-5 text-center hover:border-slate-600 transition-colors"
              >
                <tech.icon className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-50 mb-1">{tech.name}</h3>
                <p className="text-xs text-slate-500">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-12 md:p-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Start Accepting Payments Today</h2>
            <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
              Join the decentralized payment revolution. POS mode, storefronts, webhooks, and developer APIs — everything you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-emerald-700 font-medium rounded-lg hover:bg-emerald-50 transition-colors"
              >
                Create Your First Payment
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/developers"
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-emerald-300 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors"
              >
                View API Docs
                <Code2 className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-slate-50">QIE<span className="text-emerald-500">Pay</span></span>
          </div>
          <p className="text-sm text-slate-500">
            Built for QIE Blockchain Hackathon 2026
          </p>
          <div className="flex items-center gap-4">
            <a href="https://explorer.qie.io" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Explorer
            </a>
            <a href="https://rpc.qie.io" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              RPC
            </a>
            <Link to="/developers" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              API Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
