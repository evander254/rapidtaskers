import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  ClipboardList, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Wallet,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

function Sidebar() {
  const { profile, signOut } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Available Tasks', icon: <Briefcase size={20} />, path: '/tasks' },
    { name: 'My Tasks', icon: <ClipboardList size={20} />, path: '/my-tasks' },
    { name: 'Wallet', icon: <Wallet size={20} />, path: '/wallet' },
  ];

  const statusItems = [
    { name: 'Completed', icon: <CheckCircle size={18} />, path: '/my-tasks?status=completed', color: 'text-green-500' },
    { name: 'Rejected', icon: <XCircle size={18} />, path: '/my-tasks?status=rejected', color: 'text-red-500' },
    { name: 'Corrections', icon: <AlertCircle size={18} />, path: '/my-tasks?status=correction', color: 'text-yellow-500' },
  ];

  return (
    <aside 
      className={`
        hidden md:flex flex-col h-[calc(100vh-60px)] sticky top-[60px] transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900
        ${sidebarCollapsed ? 'w-[80px]' : 'w-[250px]'}
      `}
    >
      {/* Collapse Toggle */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-gray-800 text-gray-500 rounded-full flex items-center justify-center shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-50 cursor-pointer"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
        {/* Main Menu */}
        <div className="space-y-1 mb-8">
          {!sidebarCollapsed && (
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Navigation</p>
          )}
          {navItems.map((item) => (
            <NavLink 
              key={item.name} 
              to={item.path} 
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-sm group relative
                ${isActive 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
              `}
              title={sidebarCollapsed ? item.name : ''}
            >
              <span className="shrink-0">{item.icon}</span>
              {!sidebarCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </div>

        {/* Status Tracking */}
        <div className="space-y-1 mb-8">
          {!sidebarCollapsed && (
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">My Projects</p>
          )}
          {statusItems.map((item) => (
            <NavLink 
              key={item.name} 
              to={item.path} 
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative
                ${isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
              `}
              title={sidebarCollapsed ? item.name : ''}
            >
              <span className={`${item.color} shrink-0`}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </div>

        {/* Admin Section */}
        {profile?.role === 'admin' && (
          <div className="space-y-1 pt-6 mt-6 border-t border-gray-200 dark:border-gray-800">
            {!sidebarCollapsed && (
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Management</p>
            )}
            <NavLink 
              to="/admin" 
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-sm group relative
                ${isActive 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
              `}
              title={sidebarCollapsed ? 'Admin Console' : ''}
            >
              <ShieldCheck size={20} className="shrink-0" />
              {!sidebarCollapsed && <span>Client Panel</span>}
            </NavLink>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-sm group relative
            ${isActive 
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
          `}
          title={sidebarCollapsed ? 'Settings' : ''}
        >
          <User size={20} className="shrink-0" />
          {!sidebarCollapsed && <span>Account Settings</span>}
        </NavLink>

        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-lg font-medium transition-colors text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 group relative cursor-pointer"
          title={sidebarCollapsed ? 'Sign Out' : ''}
        >
          <LogOut size={20} className="shrink-0" />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
