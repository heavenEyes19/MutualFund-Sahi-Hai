import { Outlet } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Navbar from '../components/layout/Navbar';
import useDarkMode from '../hooks/useDarkMode';
import ChatWidget from '../components/chat/ChatWidget';
import useAuthStore from '../store/useAuthStore';
import useNotificationStore from '../store/useNotificationStore';
import { BACKEND_URL } from '../services/api';

/**
 * Main dashboard layout wrapper
 * Top navigation architecture (No sidebar)
 */
const DashboardLayout = () => {
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const { user } = useAuthStore();
  const { fetchNotifications, addNotification } = useNotificationStore();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const newSocket = io(BACKEND_URL);
      
      newSocket.on("connect", () => {
        newSocket.emit("joinChat", user._id || user.id);
      });

      newSocket.on("newNotification", (notification) => {
        addNotification(notification);
        toast(notification.title + "\n" + notification.message, {
          icon: '🔔',
          style: {
            borderRadius: '12px',
            background: isDarkMode ? '#1E293B' : '#fff',
            color: isDarkMode ? '#fff' : '#0f172a',
          },
        });
      });

      setSocket(newSocket);
      return () => newSocket.disconnect();
    }
  }, [user, fetchNotifications, addNotification]);

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
      <Toaster position="top-right" />
    </div>
  );
};

export default DashboardLayout;
