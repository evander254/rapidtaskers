import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useToast } from './Toast';
import { LogOut, User, ChevronDown, Rocket, Sun, Moon, Wallet, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Button from './ui/Button';

function Navbar() {
  const { user, profile, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    toast.success('Session Ended', 'You have been securely logged out.');
    await signOut();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <nav className="px-4 sm:px-6 py-3 flex justify-between items-center w-full max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Rocket size={18} />
          </div>
          <span className="font-semibold text-lg text-gray-900 dark:text-white hidden sm:inline">
            RapidTaskers
          </span>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user ? (
            <>
              {/* Notification Toggle */}
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full border border-white dark:border-gray-900"></span>
              </button>

              {/* Balance (Desktop & Mobile) */}
              <Link to="/wallet" className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Balance</span>
                  <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">${profile?.balance_available?.toFixed(2) || '0.00'}</span>
                </div>
              </Link>

              {/* User Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{profile?.full_name}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mt-0.5">{profile?.role === 'admin' ? 'Client' : 'Freelancer'}</p>
                    </div>

                    <div className="p-1">
                      <Link 
                        to="/profile" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <User size={16} /> 
                        Settings
                      </Link>
                      <Link 
                        to="/wallet" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Wallet size={16} /> 
                        Wallet
                      </Link>
                      <div className="h-px bg-gray-200 dark:bg-gray-800 my-1 mx-2"></div>
                      <button 
                        onClick={handleSignOut} 
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full text-left transition-colors"
                      >
                        <LogOut size={16} /> 
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex gap-3 items-center">
              <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Sign In</Link>
              <Button onClick={() => navigate('/signup')}>Get Started</Button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
