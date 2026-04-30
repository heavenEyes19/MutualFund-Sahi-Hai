import { useState } from 'react';
import { Menu, Moon, Sun, LogOut, User } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

/**
 * Top navigation bar component
 * Features: hamburger menu (mobile), dark mode toggle, user profile dropdown
 */
const Navbar = ({ onMenuToggle, isDarkMode, onDarkModeToggle }) => {
  const { user, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    // You can add navigation to login page here
    // navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50 shadow-sm">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">
        {/* Left section: Logo and hamburger */}
        <div className="flex items-center gap-4">
          {/* Hamburger menu (mobile) */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu size={24} className="text-gray-700 dark:text-gray-300" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">MF</span>
            </div>
            <span className="hidden sm:inline font-bold text-lg text-gray-900 dark:text-white">
              MutualFund AI
            </span>
          </div>
        </div>

        {/* Right section: Dark mode toggle and profile */}
        <div className="flex items-center gap-4">
          {/* Dark mode toggle */}
          <button
            onClick={onDarkModeToggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun size={20} className="text-gray-700 dark:text-gray-300" />
            ) : (
              <Moon size={20} className="text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role || 'guest'}
                </span>
              </div>
            </button>

            {/* Profile dropdown menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                {/* Profile header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>

                {/* Menu items */}
                <a
                  href="#profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User size={16} />
                  My Profile
                </a>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-200 dark:border-gray-700"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
