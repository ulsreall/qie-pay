import { Link } from 'react-router-dom';
import {
  Zap,
  Shield,
  Globe,
  Clock,
  ArrowRight,
  Wallet,
  Store,
  CreditCard,
  ChevronRight,
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Shield,
      title: 'Secure Escrow',
      description:
        'Payments are held in smart contract escrow until settlement, protecting both merchants and customers.',
    },
    {
      icon: Zap,
      title: 'Instant Settlement',
      description:
        'Receive funds directly to your wallet with minimal fees. No waiting for bank transfers.',
    },
    {
      icon: Globe,
      title: 'Borderless Payments',
      description:
        'Accept payments from anyone, anywhere in the world. No geographic restrictions.',
    },
    {
      icon: Clock,
      title: 'Low Fees',
      description:
        'Only 2.5% platform fee. No hidden charges, no monthly subscriptions.',
    },
  ];

  const steps = [
    {
      number: '01',
      icon: Store,
      title: 'Register as Merchant',
      description:
        'Connect your wallet and register as a merchant on QIE blockchain. It takes just one click.',
    },
    {
      number: '02',
      icon: CreditCard,
      title: 'Create Payment Request',
      description:
        'Generate a payment link with order details. Share it with your customers instantly.',
    },
    {
      number: '03',
      icon: Wallet,
      title: 'Receive QIE',
      description:
        'Customers pay with QIE. Funds are settled directly to your wallet with low fees.',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-8">
              <Zap size={14} className="text-primary-400" />
              <span className="text-sm text-primary-300">
                Built on QIE Blockchain
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              <span className="text-white">Accept Crypto </span>
              <span className="gradient-text">Payments</span>
              <br />
              <span className="text-white">With Ease</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              QIEPay is a decentralized payment gateway that enables merchants
              to accept QIE cryptocurrency payments with secure escrow and
              instant settlement.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/create"
                className="btn-primary flex items-center gap-2 text-lg px-8 py-3.5"
              >
                Register & Start
                <ArrowRight size={20} />
              </Link>
              <a
                href="#how-it-works"
                className="btn-secondary flex items-center gap-2 text-lg px-8 py-3.5"
              >
                How It Works
                <ChevronRight size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="gradient-text">QIEPay</span>?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A complete payment solution built for the decentralized economy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="card hover:border-primary-500/50 transition-all group"
                >
                  <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                    <Icon size={24} className="text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-28 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Start accepting crypto payments in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-[calc(50%+60px)] w-[calc(100%-120px)] h-px bg-gradient-to-r from-primary-500/50 to-transparent" />
                  )}
                  <div className="card text-center relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      STEP {step.number}
                    </div>
                    <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 mt-2">
                      <Icon size={28} className="text-primary-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card bg-gradient-to-br from-primary-500/10 to-purple-500/10 border-primary-500/20 text-center py-16 animate-pulse-glow">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start?
            </h2>
            <p className="text-gray-300 text-lg max-w-xl mx-auto mb-8">
              Join the decentralized payment revolution. Register as a merchant
              and start accepting QIE payments today.
            </p>
            <Link
              to="/create"
              className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-3.5"
            >
              Register as Merchant
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-primary-500" />
            <span className="font-bold text-white">QIEPay</span>
          </div>
          <p className="text-gray-500 text-sm">
            QIE Blockchain Hackathon 2026. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
