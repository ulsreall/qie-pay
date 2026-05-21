import { NavLink, Link } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  BarChart3,
  PlusCircle,
  Layers,
  Settings,
  X,
} from 'lucide-react';
import WalletConnect from './WalletConnect';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/create', label: 'Create Payment', icon: PlusCircle },
  { path: '/batch', label: 'Batch Payments', icon: Layers },
  { path: '/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ onNavClick }) {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20 shadow-sm shadow-purple-500/5'
        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-6">
        <Link
          to="/"
          className="flex items-center gap-3 group"
          onClick={onNavClick}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-bold">
              <span className="text-gradient">QIE</span>
              <span className="text-white">Pay</span>
            </span>
            <p className="text-[10px] text-slate-500 -mt-0.5 leading-tight">
              Payment Gateway
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={linkClass}
              onClick={onNavClick}
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Wallet at bottom */}
      <div className="p-4 border-t border-white/5">
        <WalletConnect compact />
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* ---- Mobile overlay ---- */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* ---- Sidebar panel ---- */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-[280px]
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: 'rgba(8, 8, 18, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(139, 92, 246, 0.08)',
        }}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>

        <SidebarContent onNavClick={onClose} />
      </aside>
    </>
  );
}
