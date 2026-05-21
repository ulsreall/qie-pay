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
import MerchantSettings from './pages/MerchantSettings';
import FeeCalculator from './pages/FeeCalculator';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-[#FAFAFA]">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1E293B',
            color: '#F8FAFC',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#1E293B' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#1E293B' } },
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
        <Route path="/merchant-settings" element={<Layout><MerchantSettings /></Layout>} />
        <Route path="/calculator" element={<Layout><FeeCalculator /></Layout>} />
      </Routes>
    </div>
  );
}
