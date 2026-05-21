import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 30, stiffness: 400 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 16,
    transition: { duration: 0.15, ease: 'easeInOut' },
  },
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal card */}
          <motion.div
            className={`relative ${maxWidth} w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Close button when no title */}
            {!title && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors z-10"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}

            {/* Content */}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
