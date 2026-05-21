import { useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  return (
    <div className="min-h-screen gradient-bg">
      {/* Sidebar — fixed on desktop, overlay on mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 glass rounded-xl text-slate-400 hover:text-white transition-colors"
        aria-label="Toggle navigation"
      >
        <Menu size={20} />
      </button>

      {/* Main content — scrollable, offset for sidebar on desktop */}
      <main className="lg:ml-[280px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
