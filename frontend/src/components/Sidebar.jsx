import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Monitor,
  BarChart3,
  Layers,
  Store,
  Receipt,
  UserCog,
  Settings,
  Webhook,
  Code2,
  Calculator,
  Coins,
  Vote,
  Gift,
  X,
} from 'lucide-react';
import WalletConnect from './WalletConnect';
import NotificationCenter from './NotificationCenter';

/* ─── Navigation: organized by merchant workflow ─── */
const navSections = [
  {
    label: 'Quick Actions',
    items: [
      { path: '/create', label: 'New Payment', icon: PlusCircle },
      { path: '/pos', label: 'POS Mode', icon: Monitor },
    ],
  },
  {
    label: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Manage',
    items: [
      { path: '/batch', label: 'Batch Payments', icon: Layers },
      { path: '/store', label: 'Storefront', icon: Store },
      { path: '/merchant-settings', label: 'Merchant Profile', icon: UserCog },
    ],
  },
  {
    label: 'DeFi',
    items: [
      { path: '/staking', label: 'Staking', icon: Coins },
      { path: '/governance', label: 'Governance', icon: Vote },
      { path: '/rewards', label: 'Rewards', icon: Gift },
    ],
  },
  {
    label: 'Settings',
    items: [
      { path: '/webhooks', label: 'Webhooks', icon: Webhook },
      { path: '/settings', label: 'Network & Export', icon: Settings },
      { path: '/calculator', label: 'Fee Calculator', icon: Calculator },
    ],
  },
  {
    label: 'Developer',
    items: [
      { path: '/developers', label: 'API Docs', icon: Code2 },
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
    `flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
      isActive
        ? 'bg-[#111113] text-[#34D399]'
        : 'text-[#A1A1AA] hover:text-[#D4D4D8] hover:bg-[#111113]/50'
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Logo + Notifications */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          onClick={onNavClick}
        >
          <LogoIcon size={28} />
          <div>
            <span className="text-base font-bold tracking-tight">
              <span className="text-[#FAFAFA]">QIE</span>
              <span className="text-[#10B981]">Pay</span>
            </span>
            <p className="text-[9px] text-[#52525B] leading-tight tracking-wider uppercase">
              Payment Gateway
            </p>
          </div>
        </Link>
        <NotificationCenter />
      </div>

      {/* Separator */}
      <div className="mx-4 my-2 border-t border-[#1E1E21]" />

      {/* Navigation sections */}
      <nav className="flex-1 px-3 space-y-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#52525B]">
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
                    <Icon size={16} className="opacity-60" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Wallet at bottom */}
      <div className="p-3 border-t border-[#1E1E21]">
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
          fixed top-0 left-0 z-40 h-full w-[220px]
          flex flex-col
          bg-[#09090B] border-r border-[#1E1E21]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-3 right-3 p-1 rounded-md text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#111113] transition-colors"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>

        <SidebarContent onNavClick={onClose} />
      </aside>
    </>
  );
}
