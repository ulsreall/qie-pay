import { useState, useEffect } from 'react';
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
  Droplets,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import WalletConnect from './WalletConnect';
import NotificationCenter from './NotificationCenter';

const STORAGE_KEY = 'sidebar_collapsed';

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
      { path: '/merchant-settings', label: 'Merchant Settings', icon: UserCog },
    ],
  },
  {
    label: 'DeFi',
    items: [
      { path: '/staking', label: 'Staking', icon: Coins },
      { path: '/governance', label: 'Governance', icon: Vote },
      { path: '/rewards', label: 'Rewards', icon: Gift },
      { path: '/faucet', label: 'Faucet', icon: Droplets },
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
export function LogoIcon({ size = 32 }) {
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

/* ─── Tooltip for collapsed nav items ─── */
function NavTooltip({ label, children }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-[#27272A] text-[#FAFAFA] text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-200 pointer-events-none z-50 shadow-lg">
        {label}
      </div>
    </div>
  );
}

function SidebarContent({ onNavClick, collapsed, onToggle }) {
  const linkClass = ({ isActive }) => {
    const base = collapsed
      ? 'flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all duration-200'
      : 'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200';
    return `${base} ${
      isActive
        ? 'bg-[rgba(16,185,129,0.08)] text-[#34D399] shadow-[inset_0_0_0_1px_rgba(16,185,129,0.12)]'
        : 'text-[#A1A1AA] hover:text-[#D4D4D8] hover:bg-[#18181B]'
    }`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo + Notifications */}
      <div className={`${collapsed ? 'px-2 py-3' : 'p-4 pb-2'} flex items-center ${collapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}>
        <Link
          to="/"
          className={`flex items-center group ${collapsed ? 'justify-center' : 'gap-2.5'}`}
          onClick={onNavClick}
        >
          <LogoIcon size={collapsed ? 28 : 28} />
          {!collapsed && (
            <div>
              <span className="text-base font-bold tracking-tight">
                <span className="text-[#FAFAFA]">QIE</span>
                <span className="text-[#10B981]">Pay</span>
              </span>
              <p className="text-[9px] text-[#52525B] leading-tight tracking-wider uppercase">
                Payment Gateway
              </p>
            </div>
          )}
        </Link>
        <NotificationCenter collapsed={collapsed} />
      </div>

      {/* Separator */}
      <div className={`${collapsed ? 'mx-2' : 'mx-4'} my-2 border-t border-[#1E1E21]`} />

      {/* Navigation sections */}
      <nav className={`flex-1 ${collapsed ? 'px-1' : 'px-3'} space-y-3 overflow-y-auto`}>
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#52525B]">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const link = (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={linkClass}
                    onClick={onNavClick}
                  >
                    <Icon size={16} className="opacity-60 shrink-0 transition-opacity duration-200 group-hover:opacity-100" />
                    {!collapsed && item.label}
                  </NavLink>
                );

                return collapsed ? (
                  <NavTooltip key={item.path} label={item.label}>
                    {link}
                  </NavTooltip>
                ) : link;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center gap-2 mx-3 mb-2 px-3 py-2 rounded-lg bg-[#111113] border border-[#27272A] hover:border-[#3F3F46] hover:bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] transition-all duration-200 text-xs font-medium"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
        {!collapsed && <span>Collapse</span>}
      </button>

      {/* Wallet at bottom */}
      <div className={`${collapsed ? 'px-2' : 'p-3'} border-t border-[#1E1E21]`}>
        <WalletConnect compact collapsed={collapsed} />
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggle }) {
  return (
    <>
      {/* Mobile overlay with backdrop blur */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full
          ${collapsed ? 'w-[64px]' : 'w-[280px]'}
          flex flex-col
          bg-[#09090B] border-r border-[#1E1E21]
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-all duration-200"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>

        <SidebarContent onNavClick={onClose} collapsed={collapsed} onToggle={onToggle} />
      </aside>
    </>
  );
}
