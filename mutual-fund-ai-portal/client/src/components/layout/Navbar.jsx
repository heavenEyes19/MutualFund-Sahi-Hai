import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Bell, User, LogOut, ChevronDown, Search, 
  TrendingUp, Wallet, ShieldCheck, Moon, Sun, ShoppingCart, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';
import WalletDropdown from '../wallet/WalletDropdown';
import { getWalletDetails } from '../../services/walletService';

const Navbar = ({ isDarkMode, onDarkModeToggle }) => {
  const { user, logout } = useAuthStore();
  const { cartItems } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const walletRef = useRef(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      getWalletDetails().then(data => setWalletBalance(data.balance)).catch(console.error);
    }
  }, [user]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotificationsOpen(false);
      if (walletRef.current && !walletRef.current.contains(event.target)) setIsWalletOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard-area/mutual-funds?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMobileNavOpen(false);
    }
  };

  const isActiveTab = (path) => location.pathname === path;

  const tabs = user?.role === 'admin' 
    ? [
        { name: 'Analytics', path: '/dashboard-area/analytics' },
        { name: 'KYC Approvals', path: '/dashboard-area/kyc-management' },
        { name: 'Fund Master', path: '/dashboard-area/fund-master' },
        { name: 'Settings', path: '/dashboard-area/settings' },
        { name: 'Support', path: '/dashboard-area/admin-support' },
      ]
    : [
        { name: 'Explore', path: '/dashboard-area/explore' },
        { name: 'Portfolio', path: '/dashboard-area/portfolio' },
        { name: 'SIPs', path: '/dashboard-area/sips' },
        { name: 'Mutual Funds', path: '/dashboard-area/mutual-funds' },
        { name: 'Support', path: '/dashboard-area/support' },
      ];

  return (
    <header className="sticky top-0 z-[100] w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20 gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => navigate(user?.role === 'admin' ? '/dashboard-area/analytics' : '/dashboard-area/explore')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
            <div className="hidden xs:block">
              <p className="font-bold text-slate-900 dark:text-white text-[14px] sm:text-[15px] tracking-tight leading-none">Mutual Funds</p>
              <p className="text-[10px] sm:text-[11px] text-indigo-500 font-bold tracking-wider uppercase">Sahi Hai</p>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input
                id="nav-search"
                type="text"
                placeholder="Search for funds, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm rounded-2xl py-2.5 pl-11 pr-16 outline-none transition-all"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                <span>⌘</span><span>K</span>
              </div>
            </form>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Dark Mode Toggle */}
            <button
              onClick={onDarkModeToggle}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-center transition-all text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Wallet Icon */}
            {user?.role !== 'admin' && (
              <div className="relative" ref={walletRef}>
                <button
                  onClick={() => setIsWalletOpen(!isWalletOpen)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-center transition-all text-slate-600 dark:text-slate-400 active:scale-95"
                >
                  <Wallet size={18} />
                  {walletBalance > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#4ade80] border-2 border-white dark:border-slate-900 rounded-full"></span>
                  )}
                </button>
                <AnimatePresence>
                  {isWalletOpen && (
                    <WalletDropdown onClose={() => setIsWalletOpen(false)} />
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-center transition-all text-slate-600 dark:text-slate-400 active:scale-95"
              >
                <Bell size={18} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
              </button>
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
                      <button className="text-[11px] text-indigo-500 font-bold hover:underline">Mark all read</button>
                    </div>
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <Bell size={20} className="text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">No new alerts</p>
                      <p className="text-[11px] text-slate-400 mt-1">We'll notify you when something important happens.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart - Hidden for Admins */}
            {user?.role !== 'admin' && (
              <button 
                onClick={() => navigate('/dashboard-area/cart')}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-center transition-all text-slate-600 dark:text-slate-400 active:scale-95"
              >
                <ShoppingCart size={18} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-950">
                    {cartItems.length}
                  </span>
                )}
              </button>
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-all active:scale-95"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden lg:block text-left mr-1">
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none mb-0.5">{user?.name?.split(' ')[0]}</p>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{user?.role}</p>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform hidden sm:block ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-2"
                  >
                    <div className="px-3 py-3 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <div className="space-y-0.5">
                      {tabs.map((tab) => (
                        <Link 
                          key={tab.path}
                          to={tab.path}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                            isActiveTab(tab.path)
                              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {tab.name}
                        </Link>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
            >
              <Menu size={20} />
            </button>

          </div>
        </div>
      </div>

      {/* Desktop Tabs Bar */}
      <div className="hidden md:block border-t border-slate-100 dark:border-slate-900 bg-white/50 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-8 flex items-center gap-8">
          {tabs.map(tab => {
            const active = isActiveTab(tab.path);
            return (
              <Link
                key={tab.name}
                to={tab.path}
                className={`relative py-4 text-[11px] font-black uppercase tracking-widest transition-all ${
                  active 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.name}
                {active && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] md:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white dark:bg-slate-950 z-[120] shadow-2xl md:hidden flex flex-col"
            >
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <TrendingUp size={16} />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Navigation</span>
                </div>
                <button 
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 flex flex-col gap-1 overflow-y-auto flex-1">
                <form onSubmit={handleSearchSubmit} className="relative mb-4">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search funds..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm rounded-xl py-3 pl-11 pr-4 outline-none border border-transparent focus:border-indigo-500/20"
                  />
                </form>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Main Menu</p>
                {tabs.map(tab => {
                  const active = isActiveTab(tab.path);
                  return (
                    <Link
                      key={tab.name}
                      to={tab.path}
                      onClick={() => setIsMobileNavOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                        active
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      {tab.name}
                    </Link>
                  );
                })}

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mt-6 mb-2">Account</p>
                <Link
                  to="/dashboard-area/profile"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <User size={18} className="opacity-50" />
                  Profile Settings
                </Link>
                {user?.role !== 'admin' && (
                  <Link
                    to="/dashboard-area/cart"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <ShoppingCart size={18} className="opacity-50" />
                    Investment Cart
                  </Link>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl text-sm font-bold transition-all active:scale-95"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
