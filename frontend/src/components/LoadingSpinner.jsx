import { motion } from 'framer-motion';

const sizeMap = {
  xs: 'w-3 h-3 border-[1.5px]',
  sm: 'w-4 h-4 border-[2px]',
  md: 'w-6 h-6 border-[2px]',
  lg: 'w-10 h-10 border-[3px]',
  xl: 'w-14 h-14 border-[3px]',
};

export default function LoadingSpinner({ size = 'md', text = '', className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <motion.div
        className={`
          ${sizeMap[size]}
          rounded-full
          border-slate-700 border-t-emerald-500
        `}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <motion.p
          className="text-sm text-slate-400"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

/**
 * Full-screen loading overlay
 */
export function LoadingOverlay({ text = 'Loading…' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
}

/**
 * Inline skeleton placeholder
 */
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`rounded-lg bg-slate-800 border border-slate-700 animate-pulse ${className}`}
    />
  );
}
