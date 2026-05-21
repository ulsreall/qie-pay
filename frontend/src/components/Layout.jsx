import { useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Sidebar — fixed on desktop, overlay on mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-[#111113] border border-[#27272A] rounded-md text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        aria-label="Toggle navigation"
      >
        <Menu size={18} />
      </button>

      {/* Main content — scrollable, offset for sidebar on desktop */}
      <main className="lg:ml-[220px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
