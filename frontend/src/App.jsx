import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CreatePayment from './pages/CreatePayment';
import Pay from './pages/Pay';
import MerchantProfile from './pages/MerchantProfile';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreatePayment />} />
          <Route path="/pay/:id" element={<Pay />} />
          <Route path="/merchant/:address" element={<MerchantProfile />} />
        </Routes>
      </main>
    </div>
  );
}
