import { useEffect, useState, useRef } from 'react';

export default function StatsCard({ icon: Icon, label, value, subValue, trend, color = 'emerald' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  const colorMap = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  };

  const colors = colorMap[color] || colorMap.emerald;

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
    <div
      ref={ref}
      className="card-hover group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colors.bg}`}>
          {Icon && <Icon className={`w-5 h-5 ${colors.text}`} />}
        </div>
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
          }`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-50">{formatDisplayValue()}</p>
      {subValue && (
        <p className="text-sm text-slate-500 mt-1">{subValue}</p>
      )}
    </div>
  );
}
