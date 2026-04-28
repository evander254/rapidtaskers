import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useThemeStore } from '../store/useThemeStore';

function MainLayout() {
  const { user, loading } = useAuthStore();
  const { sidebarCollapsed } = useThemeStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="flex pt-[60px] max-w-7xl mx-auto overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 py-6 md:py-8 px-4 sm:px-6 md:px-8 pb-20 md:pb-8 transition-all duration-300">
          <div className="mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export default MainLayout;
