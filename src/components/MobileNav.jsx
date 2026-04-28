import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Wallet, ShieldCheck, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

function MobileNav() {
  const { profile } = useAuthStore();

  const navItems = [
    { name: 'Home', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Tasks', icon: <Briefcase size={20} />, path: '/tasks' },
    { name: 'Wallet', icon: <Wallet size={20} />, path: '/wallet' },
    ...(profile?.role === 'admin' 
      ? [{ name: 'Client', icon: <ShieldCheck size={20} />, path: '/admin' }] 
      : [{ name: 'Profile', icon: <User size={20} />, path: '/profile' }]
    ),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 flex items-center justify-around px-2 md:hidden z-50 pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 transition-all py-3 min-w-[64px]
            ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-500'}
          `}
        >
          <div className={`p-1 transition-all`}>
             {item.icon}
          </div>
          <span className="text-[10px] font-medium">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileNav;
