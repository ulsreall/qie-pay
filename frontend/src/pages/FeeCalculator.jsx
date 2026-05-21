import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight, Info } from 'lucide-react';
import { formatUSD } from '../utils/currency';

const FEE_RATE = 0.025; // 2.5%

export default function FeeCalculator() {
  const [amountStr, setAmountStr] = useState('');

  const handleInputChange = (e) => {
    const val = e.target.value;
    // Allow empty, digits, and one decimal point
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmountStr(val);
    }
  };

  const calculations = useMemo(() => {
    const amount = parseFloat(amountStr) || 0;
    const fee = amount * FEE_RATE;
    const net = amount - fee;
    return {
      gross: amount,
      fee,
      net,
      grossUSD: formatUSD(amount),
      feeUSD: formatUSD(fee),
      netUSD: formatUSD(net),
    };
  }, [amountStr]);

  const displayNum = (n) => {
    if (n === 0) return '0.0000';
    return n.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="p-6 lg:p-8"
    >
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-[#FAFAFA] tracking-tight">Fee Calculator</h1>
          <p className="text-xs text-[#71717A] mt-0.5">See exactly how much you'll receive from each payment</p>
        </div>

        {/* Calculator Card */}
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={14} className="text-[#34D399]" />
            <h2 className="text-sm font-semibold text-[#A1A1AA]">Payment Amount</h2>
          </div>

          <div className="mb-6">
            <label className="text-xs text-[#71717A] mb-1.5 block">Amount (QIE)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2.5 text-lg font-semibold text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-[#3F3F46] transition-colors duration-150 tabular-nums"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#52525B]">
                {calculations.gross > 0 ? calculations.grossUSD : ''}
              </span>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-0">
            <ResultRow
              label="Gross Amount"
              qie={displayNum(calculations.gross)}
              usd={calculations.grossUSD}
              muted
            />
            <ResultRow
              label="Platform Fee (2.5%)"
              qie={displayNum(calculations.fee)}
              usd={calculations.feeUSD}
              isNegative
            />
            <div className="border-t border-[#27272A] my-2" />
            <ResultRow
              label="Net to Merchant"
              qie={displayNum(calculations.net)}
              usd={calculations.netUSD}
              isPrimary
            />
            <div className="flex items-center justify-between py-2.5 mt-1">
              <span className="text-xs text-[#71717A]">Effective Rate</span>
              <span className="text-xs text-[#A1A1AA] font-medium tabular-nums">2.5%</span>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-[#111113] border border-[#27272A] rounded-lg p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} className="text-[#34D399]" />
            <h2 className="text-sm font-semibold text-[#A1A1AA]">How it works</h2>
          </div>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
              <span className="text-xs text-[#A1A1AA] leading-relaxed">Customer pays the full amount in QIE</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
              <span className="text-xs text-[#A1A1AA] leading-relaxed">Platform fee (2.5%) is deducted on settlement</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
              <span className="text-xs text-[#A1A1AA] leading-relaxed">Merchant receives the net amount directly in their wallet</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/create"
            className="inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-white font-medium rounded-md px-5 py-2.5 text-sm transition-colors duration-150"
          >
            Try it out <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function ResultRow({ label, qie, usd, isPrimary, isNegative, muted }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className={`text-xs ${isPrimary ? 'text-[#FAFAFA] font-medium' : 'text-[#71717A]'}`}>
        {label}
      </span>
      <div className="text-right">
        <span
          className={`text-sm tabular-nums font-medium ${
            isPrimary
              ? 'text-[#34D399]'
              : isNegative
              ? 'text-red-400'
              : muted
              ? 'text-[#A1A1AA]'
              : 'text-[#FAFAFA]'
          }`}
        >
          {isNegative && qie !== '0.0000' ? '- ' : ''}{qie} <span className="text-[#71717A] font-normal">QIE</span>
        </span>
        <p className="text-[11px] text-[#52525B] tabular-nums">{usd}</p>
      </div>
    </div>
  );
}
