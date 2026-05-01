import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import useDarkMode from '../hooks/useDarkMode';

/**
 * Main dashboard layout wrapper
 * Combines Navbar and Sidebar with responsive design and dark mode support
 * Wraps all authenticated pages via Outlet
 */
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navbar (fixed at top, full width) */}
      <Navbar
        onMenuToggle={handleMenuToggle}
        isDarkMode={isDarkMode}
        onDarkModeToggle={toggleDarkMode}
      />

      {/* Sidebar (responsive: overlay on mobile, fixed on desktop) */}
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

      {/* Main content area */}
      <main className="flex-1 overflow-auto pt-16 lg:ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
