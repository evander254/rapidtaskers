import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { ToastProvider } from './components/Toast';

// Components
import Navbar from './components/Navbar';
import MainLayout from './components/MainLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import MyTasks from './pages/MyTasks';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { supabase } from './services/supabase';
import { useNavigate } from 'react-router-dom';

function App() {
  const { initialize, user, profile, loading } = useAuthStore();

  const { theme } = useThemeStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin shadow-2xl shadow-indigo-600/20"></div>
          <div className="space-y-1 text-center">
            <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold uppercase tracking-[0.3em] animate-pulse">Loading Application</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest opacity-80">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<><Navbar /><div className="pt-14"><Home /></div></>} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes with Sidebar */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={profile?.status === 'approved' ? <Tasks /> : <Navigate to="/dashboard" />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/admin" element={profile?.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
