import { useState, useCallback, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const STORAGE_KEY = 'sidebar_collapsed';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Sidebar — fixed on desktop, overlay on mobile */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
      />

      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-[#111113] border border-[#27272A] rounded-md text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        aria-label="Toggle navigation"
      >
        <Menu size={18} />
      </button>

      {/* Main content — scrollable, offset for sidebar on desktop */}
      <main
        className="min-h-screen transition-[margin-left] duration-300 ease-in-out lg:ml-[64px]"
        style={{ marginLeft: undefined }}
      >
        {/* Desktop: override margin based on collapsed state */}
        <style>{`
          @media (min-width: 1024px) {
            main { margin-left: ${collapsed ? '64px' : '220px'} !important; }
          }
        `}</style>
        {children}
      </main>
    </div>
  );
}
