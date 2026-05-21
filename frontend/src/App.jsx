import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CreatePayment from './pages/CreatePayment';
import Pay from './pages/Pay';
import MerchantProfile from './pages/MerchantProfile';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>
        {/* Home: full-width, no sidebar */}
        <Route path="/" element={<Home />} />

        {/* Internal pages: with sidebar layout */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/create"
          element={
            <Layout>
              <CreatePayment />
            </Layout>
          }
        />
        <Route
          path="/pay/:id"
          element={<Pay />}
        />
        <Route
          path="/merchant/:address"
          element={
            <Layout>
              <MerchantProfile />
            </Layout>
          }
        />
      </Routes>
    </div>
  );
}
