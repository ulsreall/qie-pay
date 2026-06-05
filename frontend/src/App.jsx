import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { EmailWalletProvider, PasswordPrompt, useEmailWallet } from './utils/email-wallet';

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
const Faucet = lazy(() => import('./pages/Faucet'));
const Governance = lazy(() => import('./pages/Governance'));
const Rewards = lazy(() => import('./pages/Rewards'));
const NotFound = lazy(() => import('./pages/NotFound'));
const StorefrontRedirect = lazy(() => import('./pages/StorefrontRedirect'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090B]">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="md" />
        <p className="text-xs text-[#52525B]">Loading...</p>
      </div>
    </div>
  );
}

function PasswordGate({ children }) {
  const { needsPassword } = useEmailWallet();

  if (needsPassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090B]/95 backdrop-blur-sm">
        <div className="w-full max-w-sm mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#FAFAFA]">QIEPay</h1>
            <p className="text-sm text-[#71717A] mt-1">Unlock your wallet to continue</p>
          </div>
          <PasswordPrompt />
        </div>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <EmailWalletProvider>
    <PasswordGate>
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

      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Full-width pages (no sidebar) */}
          <Route path="/" element={<Home />} />
          <Route path="/pay/:id" element={<Pay />} />
          <Route path="/widget/:address" element={<Widget />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/store" element={<StorefrontRedirect />} />
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
          <Route path="/faucet" element={<Layout><Faucet /></Layout>} />
          <Route path="/governance" element={<Layout><Governance /></Layout>} />
          <Route path="/rewards" element={<Layout><Rewards /></Layout>} />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </div>
    </PasswordGate>
    </EmailWalletProvider>
  );
}
