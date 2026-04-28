import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { Rocket, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Access Granted', 'Welcome back.');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Access Denied', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Rocket size={20} />
            </div>
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">RapidTaskers</span>
          </div>

          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Or{' '}
              <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                create a new account
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />

              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <div className="flex items-center justify-end">
                  <Link to="/forgot-password" size="sm" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button type="submit" disabled={loading} wFull>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column / Image Area */}
      <div className="hidden lg:block relative w-full flex-1 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
        <div className="absolute inset-0 flex items-center justify-center p-12">
           <div className="max-w-md text-center space-y-6">
             <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
               <ShieldCheck size={32} />
             </div>
             <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Secure Access</h3>
             <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
               Your connection is protected by enterprise-grade security. Join the marketplace and start completing tasks with confidence.
             </p>
           </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
