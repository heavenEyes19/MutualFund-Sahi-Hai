import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import useDarkMode from '../hooks/useDarkMode';
import ChatWidget from '../components/chat/ChatWidget';

/**
 * Main dashboard layout wrapper
 * Top navigation architecture (No sidebar)
 */
const DashboardLayout = () => {
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300`}>
      {/* Navbar (fixed at top, full width, includes tabs) */}
      <Navbar
        isDarkMode={isDarkMode}
        onDarkModeToggle={toggleDarkMode}
      />

      {/* Main content area — offset for fixed navbar */}
      {/* pt-16 (top row) + pt-12 (tabs row) + extra spacing = ~120px for desktop */}
      {/* On mobile, tabs row is hidden or in drawer, so pt-20 is enough */}
      <main className="pt-6 md:pt-8 pb-10 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto min-h-screen">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
};

export default DashboardLayout;
