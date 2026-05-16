import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Search, Bell, ShoppingCart, MoreHorizontal, Moon, Sun, LogOut, User, FileCheck } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';

export default function Navbar({ isDarkMode, onDarkModeToggle }) {
  const { user, logout } = useAuthStore();
  const { cartItems } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('nav-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard-area/mutual-funds?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const investorTabs = [
    { name: 'Explore', path: '/dashboard-area/explore' },
    { name: 'Portfolio', path: '/dashboard-area/portfolio' },
    { name: 'SIPs', path: '/dashboard-area/sips' },
    { name: 'Help & Support', path: '/dashboard-area/support' },
  ];

  const adminTabs = [
    { name: 'Analytics', path: '/dashboard-area/analytics' },
    { name: 'KYC Management', path: '/dashboard-area/kyc-management' },
    { name: 'Fund Master', path: '/dashboard-area/fund-master' },
    { name: 'Support', path: '/dashboard-area/support' },
    { name: 'Settings', path: '/dashboard-area/settings' },
  ];

  const tabs = user?.role === 'admin' ? adminTabs : investorTabs;

  const getTabClass = (path) => {
    const isActive = location.pathname.includes(path);
    return isActive
      ? "bg-[#2A2A2A] dark:bg-[#EAEAEA] text-white dark:text-[#111] font-medium border-b-2 border-[#549E82] rounded-t-xl rounded-b-sm"
      : "text-slate-400 dark:text-slate-500 font-medium hover:text-[#333] dark:hover:text-[#CCC] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl border border-transparent";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAF7] dark:bg-[#111111] border-b border-[#EAE7DF] dark:border-[#333]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* TOP ROW: Logo, Search, Action Icons */}
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo Area */}
          <div 
            onClick={() => navigate(user?.role === 'admin' ? '/dashboard-area/analytics' : '/dashboard-area/explore')}
            className="flex items-center gap-4 cursor-pointer group"
          >
            {/* Minimalist Logo Icon */}
            <div className="w-12 h-12 bg-[#4A7D69] rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0">
              {/* White Triangle */}
              <div className="absolute bottom-2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] border-b-white/90"></div>
              <div className="absolute bottom-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-[#4A7D69]"></div>
              {/* Orange Dot */}
              <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#DE7748] rounded-full border border-white/20 shadow-[0_0_8px_rgba(222,119,72,0.6)]"></div>
            </div>

            {/* Typography */}
            <div className="hidden sm:flex flex-col justify-center">
              <h1 className="font-serif text-xl tracking-tight text-[#2A5C75] dark:text-[#6CB1D4] leading-tight">
                Mutual Funds <span className="text-[#4A7D69] dark:text-[#5FC09C]">Sahi Hai</span>
              </h1>
              <p className="text-[11px] font-sans text-slate-400 dark:text-slate-500 tracking-wide mt-0.5">
                Smart investing, simplified
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input 
                id="nav-search"
                type="text"
                placeholder="Search funds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#EFEDEA] dark:bg-[#1A1A1A] border border-transparent focus:border-[#D1CECB] dark:focus:border-[#333] text-[#333] dark:text-[#EEE] placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-medium rounded-2xl py-3 pl-11 pr-12 outline-none transition-all"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 text-slate-400 dark:text-slate-600 font-sans text-xs">
                <span className="font-sans">⌘</span>
                <span>K</span>
              </div>
            </form>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-11 h-11 rounded-xl bg-[#EFEDEA] dark:bg-[#1A1A1A] hover:bg-[#E5E3E0] dark:hover:bg-[#222] flex items-center justify-center transition-colors border border-transparent"
              >
                <Bell size={20} className="text-[#555] dark:text-[#CCC]" />
              </button>
              
              {/* Mock Notification Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#111] border border-[#EAE7DF] dark:border-[#333] rounded-2xl shadow-xl z-50 p-4">
                  <h3 className="font-serif text-[#333] dark:text-[#EEE] mb-3">Notifications</h3>
                  <div className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center border border-dashed border-[#EAE7DF] dark:border-[#333] rounded-xl">
                    No new notifications
                  </div>
                </div>
              )}
            </div>

            {/* Cart - Hidden for Admins */}
            {user?.role !== 'admin' && (
              <button 
                onClick={() => navigate('/dashboard-area/cart')}
                className="relative w-11 h-11 rounded-xl bg-[#EFEDEA] dark:bg-[#1A1A1A] hover:bg-[#E5E3E0] dark:hover:bg-[#222] flex items-center justify-center transition-colors border border-transparent"
              >
                <ShoppingCart size={20} className="text-[#555] dark:text-[#CCC]" />
                {cartItems.length > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#D86F45] rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#FAFAF7] dark:border-[#111111]">
                    {cartItems.length}
                  </div>
                )}
              </button>
            )}

            {/* Profile Avatar */}
            <button className="w-11 h-11 rounded-full bg-[#4A7D69] border-2 border-white dark:border-[#111] shadow-sm flex items-center justify-center text-white font-bold text-sm ml-1 transition-transform hover:scale-105">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </button>

            {/* More Menu (includes dark mode and logout) */}
            <div className="relative ml-1">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-9 h-9 rounded-xl bg-[#2A2A2A] dark:bg-[#EAEAEA] flex items-center justify-center transition-transform hover:scale-105"
              >
                <MoreHorizontal size={20} className="text-white dark:text-[#111]" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#111] border border-[#EAE7DF] dark:border-[#333] rounded-2xl shadow-xl z-50 p-2 flex flex-col gap-1">
                  
                  <div className="px-3 py-2 mb-1 border-b border-[#EAE7DF] dark:border-[#222]">
                    <p className="text-sm font-bold text-[#333] dark:text-[#EEE] truncate">{user?.name || 'User'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
                  </div>

                  <button 
                    onClick={onDarkModeToggle}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#555] dark:text-[#CCC] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] rounded-xl transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {isDarkMode ? <Sun size={16} /> : <Moon size={16} />} 
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </button>

                  <button 
                    onClick={() => { setIsMenuOpen(false); navigate('/dashboard-area/profile'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#555] dark:text-[#CCC] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] rounded-xl transition-colors"
                  >
                    <User size={16} /> My Profile
                  </button>

                  <button 
                    onClick={() => { 
                      setIsMenuOpen(false); 
                      navigate(user?.role === 'admin' ? '/dashboard-area/kyc-management' : '/dashboard-area/kyc'); 
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#555] dark:text-[#CCC] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] rounded-xl transition-colors"
                  >
                    <FileCheck size={16} /> {user?.role === 'admin' ? 'KYC Management' : 'KYC Status'}
                  </button>

                  <div className="h-px bg-[#EAE7DF] dark:bg-[#222] my-1" />

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors font-medium"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* BOTTOM ROW: Tabs */}
        <div className="flex items-center gap-2 h-12 mt-1 px-1 overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
            <Link 
              key={tab.name}
              to={tab.path}
              className={`px-6 py-2 transition-all whitespace-nowrap ${getTabClass(tab.path)}`}
            >
              {tab.name}
            </Link>
          ))}
        </div>

      </div>
    </header>
  );
}
