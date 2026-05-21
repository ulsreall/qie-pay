import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Zap, DollarSign, Shield, Wallet, QrCode, Layers, BarChart3, Link2,
  ArrowRight, ChevronRight, Globe, Code2, Database, Cpu
} from 'lucide-react';

/* ─── Animated Section Wrapper ─── */
function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ end, suffix = '', prefix = '', duration = 1500 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
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
  }, [isInView, end, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ─── Features Data ─── */
const features = [
  { icon: Zap, title: 'Instant Settlement', desc: 'Funds settle directly on-chain in seconds — no waiting for bank transfers.', color: 'purple' },
  { icon: DollarSign, title: 'Low Fees', desc: 'Only 2.5% platform fee — far below traditional payment processors.', color: 'cyan' },
  { icon: Shield, title: 'Smart Escrow', desc: 'Payments held in a trustless smart contract until settlement.', color: 'green' },
  { icon: Wallet, title: 'Multi-Wallet Support', desc: 'Works with QIE Wallet, MetaMask, and any WalletConnect-compatible wallet.', color: 'blue' },
  { icon: QrCode, title: 'QR Payments', desc: 'Generate QR codes for each invoice — customers scan and pay instantly.', color: 'pink' },
  { icon: Layers, title: 'Batch Processing', desc: 'Create and settle multiple payments at once for high-volume merchants.', color: 'orange' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Real-time revenue charts, payment tracking, and performance metrics.', color: 'yellow' },
  { icon: Link2, title: 'Payment Links', desc: 'Shareable payment URLs — no website integration required.', color: 'red' },
];

const colorClasses = {
  purple: 'bg-purple-500/20 text-purple-400 ring-purple-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 ring-cyan-500/30',
  green: 'bg-green-500/20 text-green-400 ring-green-500/30',
  blue: 'bg-blue-500/20 text-blue-400 ring-blue-500/30',
  pink: 'bg-pink-500/20 text-pink-400 ring-pink-500/30',
  orange: 'bg-orange-500/20 text-orange-400 ring-orange-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 ring-yellow-500/30',
  red: 'bg-red-500/20 text-red-400 ring-red-500/30',
};

const steps = [
  { num: 1, title: 'Connect', desc: 'Connect your wallet to QIE Blockchain. Supports QIE Wallet, MetaMask, and more.' },
  { num: 2, title: 'Create', desc: 'Create a payment request with amount, description, and optional order ID.' },
  { num: 3, title: 'Get Paid', desc: 'Share the payment link or QR code. Funds arrive in your wallet instantly.' },
];

const techStack = [
  { icon: Globe, name: 'QIE Blockchain', desc: 'Layer 1 EVM-compatible chain with 30K TPS' },
  { icon: Code2, name: 'Solidity Contracts', desc: 'Audited smart contract on-chain escrow' },
  { icon: Cpu, name: 'React', desc: 'Modern UI with Tailwind CSS & Framer Motion' },
  { icon: Database, name: 'ethers.js v6', desc: 'Direct blockchain interaction via JSON-RPC' },
];

/* ─── Page ─── */
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/30 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-500/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '10s', animationDelay: '2s' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-gray-300">Live on QIE Testnet — Chain ID 1983</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            Accept{' '}
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Crypto Payments
            </span>
            <br />With Ease
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            QIE Pay is a decentralized payment gateway built on the QIE Blockchain.
            Accept QIE payments with low fees, instant settlement, and smart escrow — all on-chain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/create"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02]"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl backdrop-blur-sm transition-all"
            >
              View Dashboard
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-white/60"
            />
          </div>
        </motion.div>
      </section>

      {/* ─── Stats Bar ─── */}
      <AnimatedSection className="py-8 px-4 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: 30000, suffix: '+', label: 'TPS Throughput' },
            { value: 2, suffix: '.5%', label: 'Platform Fee' },
            { value: 1983, suffix: '', label: 'Chain ID' },
            { value: 100, suffix: '%', label: 'On-Chain' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ─── Features Grid ─── */}
      <AnimatedSection className="py-24 px-4" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-purple-400 font-medium text-sm uppercase tracking-widest mb-3"
            >
              Features
            </motion.p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Accept Crypto</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built for merchants who want fast, secure, and transparent payment processing on the QIE Blockchain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6 group hover:border-purple-500/30 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${colorClasses[feat.color]} flex items-center justify-center mb-4 ring-1`}>
                  <feat.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─── How It Works ─── */}
      <AnimatedSection className="py-24 px-4 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-purple-400 font-medium text-sm uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold">Start in Three Simple Steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                className="text-center relative"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-purple-500/40 to-transparent" />
                )}
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-purple-500/25">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─── Tech Stack ─── */}
      <AnimatedSection className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-purple-400 font-medium text-sm uppercase tracking-widest mb-3">Technology</p>
            <h2 className="text-3xl md:text-4xl font-bold">Built on Proven Tech</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {techStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-center hover:border-purple-500/30 transition-all"
              >
                <tech.icon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-1">{tech.name}</h3>
                <p className="text-xs text-gray-500">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─── CTA Section ─── */}
      <AnimatedSection className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-white/10 rounded-3xl p-12 md:p-16 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Accepting Payments Today</h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Join the decentralized payment revolution. No middlemen, no hidden fees — just fast, transparent crypto payments.
              </p>
              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02]"
              >
                Create Your First Payment
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <span className="text-sm font-bold text-white">Q</span>
            </div>
            <span className="font-semibold text-white">QIE Pay</span>
          </div>
          <p className="text-sm text-gray-500">
            Built for QIE Blockchain Hackathon 2026
          </p>
          <div className="flex items-center gap-4">
            <a href="https://explorer.qie.io" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Explorer
            </a>
            <a href="https://rpc.qie.io" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              RPC
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
