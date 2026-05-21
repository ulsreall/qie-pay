import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CreatePayment from './pages/CreatePayment';
import Pay from './pages/Pay';
import MerchantProfile from './pages/MerchantProfile';
import Analytics from './pages/Analytics';
import BatchPayments from './pages/BatchPayments';
import Invoice from './pages/Invoice';
import Settings from './pages/Settings';
import Widget from './pages/Widget';
import POS from './pages/POS';
import Storefront from './pages/Storefront';
import Webhooks from './pages/Webhooks';
import Developers from './pages/Developers';

export default function App() {
  return (
    <div className="min-h-screen bg-[#06060e] text-white">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(15, 15, 30, 0.95)',
            backdropFilter: 'blur(16px)',
            color: '#e2e8f0',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#06060e' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#06060e' } },
        }}
      />

      <Routes>
        {/* Full-width pages (no sidebar) */}
        <Route path="/" element={<Home />} />
        <Route path="/pay/:id" element={<Pay />} />
        <Route path="/widget/:address" element={<Widget />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/store/:address" element={<Storefront />} />

        {/* Internal pages with sidebar layout */}
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
        <Route path="/create" element={<Layout><CreatePayment /></Layout>} />
        <Route path="/batch" element={<Layout><BatchPayments /></Layout>} />
        <Route path="/invoice/:id" element={<Layout><Invoice /></Layout>} />
        <Route path="/merchant/:address" element={<Layout><MerchantProfile /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/webhooks" element={<Layout><Webhooks /></Layout>} />
        <Route path="/developers" element={<Layout><Developers /></Layout>} />
      </Routes>
    </div>
  );
}
