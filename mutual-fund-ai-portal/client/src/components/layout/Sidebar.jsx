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
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-[#0B1120] border-r border-slate-800/80 overflow-y-auto transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:rounded-none custom-scrollbar shadow-[4px_0_24px_rgba(0,0,0,0.2)]`}
      >
        {/* Close button for mobile */}
        <div className="flex justify-end p-4 lg:hidden">
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Sidebar content */}
        <nav className="p-6 pt-4 lg:pt-8 flex flex-col min-h-full">
          {/* Role badge */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold tracking-widest rounded-md border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              {role} portal
            </div>
          </div>

          {/* Navigation links */}
          <ul className="space-y-3 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                      active
                        ? 'bg-blue-600/10 text-white shadow-[0_0_20px_rgba(37,99,235,0.1)] border border-blue-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>}
                    <Icon size={18} className={`transition-colors ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className={`text-sm font-semibold tracking-wide ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Divider */}
          <div className="my-8 border-t border-slate-800/80" />

          {/* Help & Support section */}
          <div className="space-y-3 pb-6">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4 mb-2">
              Support
            </p>
            <a
              href="#help"
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all duration-300 group border border-transparent"
            >
              <Sparkles size={18} className="text-slate-500 group-hover:text-slate-300" />
              <span className="text-sm font-semibold tracking-wide">Help & Docs</span>
            </a>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
