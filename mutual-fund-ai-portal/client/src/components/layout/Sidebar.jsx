import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Briefcase,
  TrendingUp,
  History,
  BarChart3,
  Lock,
  Database,
  Settings,
  X,
  Landmark,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

/**
 * Sidebar navigation component with role-based links
 * Responsive design: hidden on mobile, fixed on desktop
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useAuthStore();
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState(null);

  // Role-based navigation configuration
  const navigationConfig = {
    investor: [
      { label: 'Dashboard', path: '/dashboard-area/dashboard', icon: LayoutDashboard },
      { label: 'Mutual Funds', path: '/dashboard-area/mutual-funds', icon: Landmark },
      { label: 'AI Advisory', path: '/dashboard-area/ai-advisory', icon: Sparkles },
      { label: 'Portfolio', path: '/dashboard-area/portfolio', icon: Briefcase },
      { label: 'SIPs', path: '/dashboard-area/sips', icon: TrendingUp },
      { label: 'History', path: '/dashboard-area/history', icon: History },
    ],
    admin: [
      { label: 'Platform Analytics', path: '/dashboard-area/analytics', icon: BarChart3 },
      { label: 'KYC Management', path: '/dashboard-area/kyc-management', icon: Lock },
      { label: 'Fund Master', path: '/dashboard-area/fund-master', icon: Database },
      { label: 'Support Chats', path: '/dashboard-area/support', icon: Sparkles },
      { label: 'Settings', path: '/dashboard-area/settings', icon: Settings },
    ],
  };

  const navItems = navigationConfig[role] || navigationConfig.investor;

  const isActive = (path) => location.pathname === path;

  const toggleMenu = (label) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:rounded-none`}
      >
        {/* Close button for mobile */}
        <div className="flex justify-end p-4 lg:hidden">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Sidebar content */}
        <nav className="p-6 pt-4 lg:pt-6">
          {/* Role badge */}
          <div className="mb-8">
            <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-semibold rounded-full capitalize">
              {role}
            </div>
          </div>

          {/* Navigation links */}
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Divider */}
          <div className="my-8 border-t border-gray-200 dark:border-gray-800" />

          {/* Help & Support section */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 mb-3">
              Support
            </p>
            <a
              href="#help"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <Sparkles size={20} />
              <span className="font-medium text-sm">Help & Documentation</span>
            </a>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
