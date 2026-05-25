import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, DollarSign, Shield, Wallet, QrCode, Layers, BarChart3,
  ArrowRight, Globe, Code2, Database, Cpu,
  Monitor, Store, Webhook, FileText, Coins, Vote, Gift
} from 'lucide-react';
import { EmailLoginButton } from '../utils/email-wallet';

/* ─── Features Data ─── */
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
  { icon: Coins, title: 'Staking Rewards', desc: 'Stake QIE to reduce your payment fees — lower tiers get better rates.' },
  { icon: Vote, title: 'Governance', desc: 'Vote on protocol changes and shape the future of QIE Pay.' },
  { icon: Gift, title: 'Loyalty Tokens', desc: 'Earn QIEP reward tokens on every payment and burn them for discounts.' },
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

/* ─── Grid Background (decorative) ─── */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern with radial fade */}
      <div className="absolute inset-0 grid-bg-fade opacity-60" />
      {/* Animated gradient orbs */}
      <div
        className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.07] animate-float"
        style={{ background: 'radial-gradient(circle, #10B981 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-[0.05]"
        style={{
          background: 'radial-gradient(circle, #38BDF8 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      />
    </div>
  );
}

/* ─── Page ─── */
export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 animate-gradient opacity-40"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(9,9,11,1) 30%, rgba(9,9,11,1) 60%, rgba(56,189,248,0.06) 100%)',
            backgroundSize: '200% 200%',
          }}
        />
        <GridBackground />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
              </span>
              <span className="text-xs text-[#A1A1AA]">Live on QIE Testnet — Chain ID 1983</span>
            </div>
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3">
              <svg width="48" height="48" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981"/>
                    <stop offset="100%" stopColor="#38BDF8"/>
                  </linearGradient>
                </defs>
                <circle cx="256" cy="256" r="170" stroke="url(#hero-grad)" strokeWidth="36" fill="none"/>
                <path d="M290 108L175 300H245L220 410L340 220H265L290 108Z" fill="url(#hero-grad)"/>
              </svg>
              <div className="text-left">
                <h2 className="text-2xl font-bold tracking-tight">
                  <span className="text-[#FAFAFA]">QIE</span>
                  <span className="text-[#10B981]">Pay</span>
                </h2>
                <p className="text-[10px] text-[#52525B] tracking-widest uppercase">
                  Decentralized Payment Gateway
                </p>
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-bold leading-tight mb-5 text-[#FAFAFA] tracking-tight"
          >
            Accept{' '}
            <span className="gradient-text-emerald">Crypto Payments</span>
            <br />With Ease
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base text-[#A1A1AA] max-w-xl mx-auto mb-8 leading-relaxed"
          >
            A full-stack decentralized payment gateway on QIE Blockchain.
            Accept crypto with POS mode, storefronts, and developer APIs —
            plus DeFi features like staking, governance, and token rewards, all on-chain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              to="/create"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-lg text-sm transition-all hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.4)]"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pos"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 glass rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46] font-medium text-sm transition-all"
            >
              Try POS Mode
              <Monitor className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Email Login Option */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 max-w-xs mx-auto"
          >
            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#27272A]" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-[#09090B] px-2 text-[#52525B]">No wallet? No problem</span>
              </div>
            </div>
            <EmailLoginButton onConnect={() => navigate('/dashboard')} />
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar (4 stats) ─── */}
      <section className="py-10 px-4 border-y border-[#1E1E21] bg-[#09090B] relative">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { value: 30000, suffix: '+', label: 'TPS' },
            { value: 2, suffix: '.5%', label: 'Platform Fee' },
            { value: 1983, suffix: '', label: 'Chain ID' },
            { value: 100, suffix: '%', label: 'On-Chain' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className="text-center"
            >
              <div className="text-2xl font-semibold gradient-text-emerald">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-xs text-[#71717A] mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid (3-column) ─── */}
      <section className="py-20 px-4 relative" id="features">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-[#10B981] font-medium text-xs uppercase tracking-widest mb-3"
            >
              Features
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-[#FAFAFA] tracking-tight"
            >
              Everything You Need to Accept Crypto
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="glass-card p-5 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(16,185,129,0.08)] flex items-center justify-center shrink-0 group-hover:bg-[rgba(16,185,129,0.14)] transition-colors">
                    <feat.icon className="w-[18px] h-[18px] text-[#10B981]" />
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
      <section className="py-20 px-4 bg-[#09090B] relative">
        <div className="absolute inset-0 grid-bg-fade opacity-30 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-[#10B981] font-medium text-xs uppercase tracking-widest mb-3"
            >
              How It Works
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-[#FAFAFA] tracking-tight"
            >
              Start in Three Simple Steps
            </motion.h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-center gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.4 }}
                  className="text-center flex-shrink-0"
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-emerald-500/20">
                    {step.num}
                  </div>
                  <h3 className="text-sm font-semibold text-[#FAFAFA] mb-1">{step.title}</h3>
                  <p className="text-xs text-[#A1A1AA] max-w-[160px]">{step.desc}</p>
                </motion.div>
                {i < steps.length - 1 && (
                  <span className="text-[#3F3F46] text-2xl font-light mx-2 hidden md:block">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tech Stack (2-column) ─── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-[#10B981] font-medium text-xs uppercase tracking-widest mb-3"
            >
              Technology
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold text-[#FAFAFA] tracking-tight"
            >
              Built on Proven Tech
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {techStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="glass-card p-5 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(16,185,129,0.08)] flex items-center justify-center shrink-0 group-hover:bg-[rgba(16,185,129,0.14)] transition-colors">
                    <tech.icon className="w-5 h-5 text-[#10B981]" />
                  </div>
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

      {/* ─── CTA Section ─── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl p-5 sm:p-8 md:p-10 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
            }}
          >
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10 grid-bg" />
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">Start Accepting Payments Today</h2>
              <p className="text-emerald-100/80 text-sm mb-6 max-w-md mx-auto">
                Join the decentralized payment revolution. POS mode, storefronts, webhooks, developer APIs, and DeFi features — everything you need to accept crypto.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#047857] font-medium rounded-lg text-sm hover:bg-emerald-50 transition-all hover:shadow-lg"
                >
                  Create Your First Payment
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/developers"
                  className="inline-flex items-center gap-2 px-6 py-2.5 border border-white/30 text-white font-medium rounded-lg text-sm hover:bg-white/10 transition-all"
                >
                  View API Docs
                  <Code2 className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#1E1E21] py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="footer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981"/>
                  <stop offset="100%" stopColor="#38BDF8"/>
                </linearGradient>
              </defs>
              <circle cx="256" cy="256" r="170" stroke="url(#footer-grad)" strokeWidth="36" fill="none"/>
              <path d="M290 108L175 300H245L220 410L340 220H265L290 108Z" fill="url(#footer-grad)"/>
            </svg>
            <span className="text-sm font-semibold text-[#FAFAFA]">QIE<span className="text-[#10B981]">Pay</span></span>
          </div>
          <p className="text-xs text-[#71717A]">
            Built for QIE Blockchain Hackathon 2026
          </p>
          <div className="flex items-center gap-4">
            <a href="https://explorer.qie.io" target="_blank" rel="noopener noreferrer" className="text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors">
              Explorer
            </a>
            <a href="https://rpc1testnet.qie.digital/" target="_blank" rel="noopener noreferrer" className="text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors">
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
