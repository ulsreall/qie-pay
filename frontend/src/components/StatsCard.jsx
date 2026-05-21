import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ icon: Icon, label, value, subValue, trend, color = 'purple' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  const colorMap = {
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', ring: 'ring-purple-500/30' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', ring: 'ring-cyan-500/30' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400', ring: 'ring-green-500/30' },
    yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', ring: 'ring-yellow-500/30' },
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'ring-blue-500/30' },
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', ring: 'ring-orange-500/30' },
    red: { bg: 'bg-red-500/20', text: 'text-red-400', ring: 'ring-red-500/30' },
  };

  const colors = colorMap[color] || colorMap.purple;

  // Animated counter
  useEffect(() => {
    if (hasAnimated || value === undefined || value === null) return;

    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    if (isNaN(numValue)) {
      setDisplayValue(value);
      setHasAnimated(true);
      return;
    }

    const duration = 1200;
    const steps = 40;
    const increment = numValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(numValue);
        setHasAnimated(true);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, hasAnimated]);

  const formatDisplayValue = () => {
    if (typeof value === 'string' && !value.includes('%') && !value.includes('$') && !value.includes('K') && !value.includes(',')) {
      return value;
    }
    if (typeof value === 'string' && value.includes('%')) {
      const num = parseFloat(value);
      return `${hasAnimated ? num.toFixed(1) : displayValue.toFixed(1)}%`;
    }
    if (typeof value === 'string' && value.includes('$')) {
      const num = parseFloat(value.replace(/[$,]/g, ''));
      return `$${(hasAnimated ? num : displayValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (typeof value === 'number') {
      return (hasAnimated ? value : displayValue).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return hasAnimated ? value : displayValue;
  };

  return (
    <motion.div
      ref={ref}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${colors.bg} ring-1 ${colors.ring}`}>
            {Icon && <Icon className={`w-5 h-5 ${colors.text}`} />}
          </div>
          {trend !== undefined && trend !== null && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
            }`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>

        <p className="text-sm text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{formatDisplayValue()}</p>
        {subValue && (
          <p className="text-sm text-gray-500 mt-1">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
}
