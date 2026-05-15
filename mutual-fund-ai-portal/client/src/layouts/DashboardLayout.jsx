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
    <div className="flex flex-col h-screen bg-[#FAFAF7] dark:bg-[#111111]">
      {/* Navbar (fixed at top, full width, includes tabs) */}
      <Navbar
        isDarkMode={isDarkMode}
        onDarkModeToggle={toggleDarkMode}
      />

      {/* Main content area */}
      <main className="flex-1 overflow-auto pt-[120px] w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
};

export default DashboardLayout;
