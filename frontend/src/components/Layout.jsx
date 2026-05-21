import { useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Sidebar — fixed on desktop, overlay on mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
        aria-label="Toggle navigation"
      >
        <Menu size={20} />
      </button>

      {/* Main content — scrollable, offset for sidebar on desktop */}
      <main className="lg:ml-[240px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
