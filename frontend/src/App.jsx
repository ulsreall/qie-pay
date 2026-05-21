import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import { EmailWalletProvider } from './utils/email-wallet';

// Lazy load all pages — only download when visited
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreatePayment = lazy(() => import('./pages/CreatePayment'));
const Pay = lazy(() => import('./pages/Pay'));
const MerchantProfile = lazy(() => import('./pages/MerchantProfile'));
const Analytics = lazy(() => import('./pages/Analytics'));
const BatchPayments = lazy(() => import('./pages/BatchPayments'));
const Invoice = lazy(() => import('./pages/Invoice'));
const Settings = lazy(() => import('./pages/Settings'));
const Widget = lazy(() => import('./pages/Widget'));
const POS = lazy(() => import('./pages/POS'));
const Storefront = lazy(() => import('./pages/Storefront'));
const Webhooks = lazy(() => import('./pages/Webhooks'));
const Developers = lazy(() => import('./pages/Developers'));
const MerchantSettings = lazy(() => import('./pages/MerchantSettings'));
const FeeCalculator = lazy(() => import('./pages/FeeCalculator'));
const Staking = lazy(() => import('./pages/Staking'));
const Governance = lazy(() => import('./pages/Governance'));
const Rewards = lazy(() => import('./pages/Rewards'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="md" />
    </div>
  );
}

export default function App() {
  return (
    <EmailWalletProvider>
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA]">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#18181B',
            color: '#FAFAFA',
            border: '1px solid #27272A',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#18181B' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#18181B' } },
        }}
      />

      <Suspense fallback={<PageLoader />}>
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
          <Route path="/staking" element={<Layout><Staking /></Layout>} />
          <Route path="/governance" element={<Layout><Governance /></Layout>} />
          <Route path="/rewards" element={<Layout><Rewards /></Layout>} />
        </Routes>
      </Suspense>
    </div>
    </EmailWalletProvider>
  );
}
