import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useToast } from '../components/Toast';
import { Lock, Rocket } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Mismatch', 'Passwords do not match.');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success('Password Updated', 'Your password has been changed successfully. Please log in with your new credentials.');
      
      // Delay slightly to allow Supabase to process the update
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
      }, 1000);
    } catch (error) {
      toast.error('Update Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Rocket size={20} />
            </div>
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">RapidTaskers</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please enter your new professional credentials below.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="New Password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={18} />}
            />
            
            <Input
              label="Confirm New Password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={18} />}
            />

            <Button type="submit" disabled={loading} wFull>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default ResetPassword;
