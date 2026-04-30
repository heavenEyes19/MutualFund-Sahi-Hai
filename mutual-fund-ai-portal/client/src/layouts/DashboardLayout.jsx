import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';

/**
 * Main dashboard layout wrapper
 * Combines Navbar and Sidebar with responsive design and dark mode support
 * Wraps all authenticated pages via Outlet
 */
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950">
      {/* Navbar (fixed at top, full width) */}
      <Navbar
        onMenuToggle={handleMenuToggle}
        isDarkMode={isDarkMode}
        onDarkModeToggle={handleDarkModeToggle}
      />

      {/* Sidebar (responsive: overlay on mobile, fixed on desktop) */}
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

      {/* Main content area */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0 lg:ml-64">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
