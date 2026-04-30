import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Briefcase, ClipboardList, CheckCircle, XCircle, 
  AlertCircle, User, ShieldCheck, ChevronLeft, ChevronRight, 
  Wallet, LogOut, MessageSquare, Bell, Settings, List, 
  UserPlus, Send, Plus, Inbox, Shield, Globe, Lock, MoreHorizontal,
  ChevronDown, CreditCard, History, Users, PlusCircle, UserCheck
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

function Sidebar() {
  const { profile, signOut } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Available Tasks', icon: <Briefcase size={20} />, path: '/tasks' },
    { name: 'My Tasks', icon: <ClipboardList size={20} />, path: '/my-tasks' },
    { name: 'Wallet', icon: <Wallet size={20} />, path: '/wallet' },
    { name: 'Messages', icon: <MessageSquare size={20} />, path: '/messages' },
  ];

  const statusItems = [
    { name: 'Completed', icon: <CheckCircle size={18} />, path: '/my-tasks?status=completed', color: 'text-green-500' },
    { name: 'Rejected', icon: <XCircle size={18} />, path: '/my-tasks?status=rejected', color: 'text-red-500' },
    { name: 'Corrections', icon: <AlertCircle size={18} />, path: '/my-tasks?status=correction', color: 'text-yellow-500' },
  ];

  const adminMenu = [
    { name: 'Overview', icon: <LayoutDashboard size={20} />, path: '/admin?tab=overview' },
    { 
      name: 'Tasks', 
      icon: <ClipboardList size={20} />, 
      path: '/admin?tab=management',
      subItems: [
        { name: 'Add Task', path: '/admin?tab=tasks', icon: <PlusCircle size={16} /> },
        { name: 'View Tasks', path: '/admin?tab=management', icon: <List size={16} /> },
        { name: 'Claimed Tasks', path: '/admin?tab=management&filter=claimed', icon: <UserPlus size={16} /> },
        { name: 'Correction Tasks', path: '/admin?tab=management&filter=correction', icon: <AlertCircle size={16} /> },
        { name: 'Submitted Tasks', path: '/admin?tab=management&filter=submitted', icon: <Send size={16} /> },
        { name: 'Completed Tasks', path: '/admin?tab=management&filter=completed', icon: <CheckCircle size={16} /> },
      ]
    },
    {
      name: 'Freelancers',
      icon: <Users size={20} />,
      path: '/admin?tab=users_all',
      subItems: [
        { name: 'All Taskers', path: '/admin?tab=users_all', icon: <Users size={16} /> },
        { name: 'Approved Taskers', path: '/admin?tab=users_approved', icon: <UserCheck size={16} /> },
        { name: 'Approve Taskers', path: '/admin?tab=users_pending', icon: <UserPlus size={16} /> },
      ]
    },
    {
      name: 'Messages',
      icon: <MessageSquare size={20} />,
      path: '/admin?tab=messages',
      subItems: [
        { name: 'New Chat', path: '/admin?tab=messages_new', icon: <Plus size={16} /> },
        { name: 'Inbox', path: '/admin?tab=messages_inbox', icon: <Inbox size={16} /> },
      ]
    },
    {
      name: 'Transactions',
      icon: <CreditCard size={20} />,
      path: '/admin?tab=withdrawals',
      subItems: [
        { name: 'All Transactions', path: '/admin?tab=withdrawals&filter=all', icon: <History size={16} /> },
        { name: 'Approve Transactions', path: '/admin?tab=withdrawals', icon: <CheckCircle size={16} /> },
      ]
    },
    {
      name: 'Notifications',
      icon: <Bell size={20} />,
      path: '/admin?tab=notifications',
      subItems: [
        { name: 'All Notifications', path: '/admin?tab=notifications_all', icon: <Bell size={16} /> },
        { name: 'Create Notification', path: '/admin?tab=notifications_create', icon: <Plus size={16} /> },
      ]
    },
    {
      name: 'Settings',
      icon: <Settings size={20} />,
      path: '/admin?tab=settings',
      subItems: [
        { name: 'Admin Settings', path: '/admin?tab=settings_admin', icon: <Shield size={16} /> },
        { name: 'Website Settings', path: '/admin?tab=settings_website', icon: <Globe size={16} /> },
        { name: 'Taskers Settings', path: '/admin?tab=settings_taskers', icon: <Users size={16} /> },
        { name: 'Add Admin', path: '/admin?tab=settings_add_admin', icon: <UserPlus size={16} /> },
        { name: 'Security', path: '/admin?tab=settings_security', icon: <Lock size={16} /> },
        { name: 'Other', path: '/admin?tab=settings_other', icon: <MoreHorizontal size={16} /> },
      ]
    }
  ];

  return (
    <aside 
      className={`
        hidden md:flex flex-col h-[calc(100vh-60px)] sticky top-[60px] transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900
        ${sidebarCollapsed ? 'w-[80px]' : 'w-[260px]'}
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
        {profile?.role === 'admin' ? (
          <div className="space-y-1 mb-8">
            {!sidebarCollapsed && (
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Admin Panel</p>
            )}
            {adminMenu.map((item) => (
              <SidebarDropdown 
                key={item.name} 
                item={item} 
                isCollapsed={sidebarCollapsed} 
                currentPath={location.pathname + location.search}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Main Menu for Taskers */}
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
          </>
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

function SidebarDropdown({ item, isCollapsed, currentPath }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  
  // Check if any sub-item is active
  const isAnySubItemActive = hasSubItems && item.subItems.some(sub => currentPath === sub.path);
  const isActive = currentPath === item.path || isAnySubItemActive;

  // Auto-open if a sub-item is active
  useState(() => {
    if (isAnySubItemActive) setIsOpen(true);
  }, [isAnySubItemActive]);

  return (
    <div className="space-y-1">
      {hasSubItems ? (
        <>
          <button
            onClick={() => !isCollapsed && setIsOpen(!isOpen)}
            className={`
              w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-sm group relative
              ${isActive && !isOpen
                ? 'bg-indigo-600 text-white' 
                : isOpen 
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
            `}
            title={isCollapsed ? item.name : ''}
          >
            <div className="flex items-center gap-3">
              <span className="shrink-0">{item.icon}</span>
              {!isCollapsed && <span>{item.name}</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              />
            )}
          </button>
          
          {!isCollapsed && isOpen && (
            <div className="ml-4 pl-4 border-l border-gray-100 dark:border-gray-800 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
              {item.subItems.map((sub) => (
                <NavLink
                  key={sub.name}
                  to={sub.path}
                  className={`
                    flex items-center gap-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                    ${currentPath === sub.path
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}
                  `}
                >
                  <span className="shrink-0">{sub.icon}</span>
                  <span>{sub.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </>
      ) : (
        <NavLink 
          to={item.path} 
          className={`
            flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-sm group relative
            ${currentPath === item.path 
              ? 'bg-indigo-600 text-white' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
          `}
          title={isCollapsed ? item.name : ''}
        >
          <span className="shrink-0">{item.icon}</span>
          {!isCollapsed && <span>{item.name}</span>}
        </NavLink>
      )}
    </div>
  );
}

export default Sidebar;
