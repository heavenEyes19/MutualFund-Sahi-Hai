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
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800/80 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">
        {/* Left section: Logo and hamburger */}
        <div className="flex items-center gap-5">
          {/* Hamburger menu (mobile) */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu size={24} className="text-slate-300" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.7)] transition-shadow">
              <span className="text-white font-bold text-lg tracking-wider">MF</span>
            </div>
            <span className="hidden sm:inline font-bold text-lg text-white tracking-wide">
              Mutual-Funds Sahi Hai
            </span>
          </div>
        </div>

        {/* Right section: Dark mode toggle and profile */}
        <div className="flex items-center gap-3 lg:gap-5">
          {/* Dark mode toggle */}
          <button
            onClick={onDarkModeToggle}
            className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-colors shadow-inner"
            title="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} className="text-blue-400" />
            )}
          </button>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-800/50 rounded-xl transition-all border border-transparent hover:border-slate-700/50"
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-white">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  {user?.role || 'guest'}
                </span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-xl flex items-center justify-center text-slate-300 font-bold text-sm shadow-inner overflow-hidden">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </button>

            {/* Profile dropdown menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-[#111827] rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-slate-700 py-2 z-50 overflow-hidden">
                {/* Profile header */}
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-800/20">
                  <p className="text-sm font-bold text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>

                {/* Menu items */}
                <div className="p-2 space-y-1">
                  <a
                    href="#profile"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <User size={16} className="text-blue-400" />
                    My Profile
                  </a>

                  {/* Logout button */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors mt-1 border-t border-slate-800 pt-3"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
