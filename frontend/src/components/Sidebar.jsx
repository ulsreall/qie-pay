import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  PlusCircle,
  Layers,
  Settings,
  Monitor,
  Store,
  Webhook,
  Code2,
  X,
} from 'lucide-react';
import WalletConnect from './WalletConnect';

const navSections = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Payments',
    items: [
      { path: '/create', label: 'Create Payment', icon: PlusCircle },
      { path: '/batch', label: 'Batch Payments', icon: Layers },
      { path: '/pos', label: 'POS Mode', icon: Monitor },
      { path: '/store', label: 'Storefront', icon: Store },
    ],
  },
  {
    label: 'Developer',
    items: [
      { path: '/webhooks', label: 'Webhooks', icon: Webhook },
      { path: '/developers', label: 'API Docs', icon: Code2 },
    ],
  },
  {
    label: 'Other',
    items: [
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/* ─── Inline SVG Logo (ring + bolt) ─── */
function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sidebar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981"/>
          <stop offset="100%" stopColor="#38BDF8"/>
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="170" stroke="url(#sidebar-grad)" strokeWidth="36" fill="none"/>
      <path d="M290 108L175 300H245L220 410L340 220H265L290 108Z" fill="url(#sidebar-grad)"/>
    </svg>
  );
}

function SidebarContent({ onNavClick }) {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-slate-800 text-emerald-400'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 pb-3">
        <Link
          to="/"
          className="flex items-center gap-3 group"
          onClick={onNavClick}
        >
          <LogoIcon size={32} />
          <div>
            <span className="text-lg font-bold">
              <span className="text-white">QIE</span>
              <span className="gradient-text">Pay</span>
            </span>
            <p className="text-[10px] text-slate-500 -mt-0.5 leading-tight tracking-wider">
              PAYMENT GATEWAY
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={linkClass}
                    onClick={onNavClick}
                  >
                    <Icon size={17} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Wallet at bottom */}
      <div className="p-4 border-t border-slate-800">
        <WalletConnect compact />
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-[240px]
          flex flex-col
          bg-slate-900 border-r border-slate-800
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>

        <SidebarContent onNavClick={onClose} />
      </aside>
    </>
  );
}
