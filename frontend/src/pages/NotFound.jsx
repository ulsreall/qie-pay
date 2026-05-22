import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#09090B] flex items-center justify-center p-4"
    >
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-[#10B981]">404</h1>
        <h2 className="text-xl font-semibold text-[#FAFAFA]">Page Not Found</h2>
        <p className="text-sm text-[#71717A] max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-md transition-colors"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#3F3F46] hover:border-[#52525B] text-[#A1A1AA] text-sm rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    </motion.div>
  );
}
