import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useToast } from '../components/Toast';
import { User, Mail, Shield, Camera, Bell, Lock, Globe, Save, Activity, CheckCircle, Smartphone } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function Profile() {
  const { profile, user } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: user?.email || '',
    language: 'English (US)',
    notifications: true,
    twoFactor: false
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: formData.fullName })
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success('Settings Synchronized', 'Your identity protocols have been updated.');
    } catch (error) {
      toast.error('Update Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mismatch', 'Passwords do not match.');
      return;
    }
    
    setPasswordLoading(true);
    try {
      await supabase.auth.updateUser({ password: passwordData.newPassword });
      toast.success('Password Updated', 'Your security credentials have been refreshed.');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Security Update Failed', error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Identity Settings</h1>
        <p className="text-gray-500 mt-1">Configure your operational credentials and marketplace security protocols.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-900 dark:text-white text-3xl font-bold">
                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors border-2 border-white dark:border-gray-900 shadow-sm cursor-pointer">
                <Camera size={14} />
              </button>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{profile?.full_name}</h2>
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-6">Institutional Protocol Agent</p>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-center gap-2">
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700">LVL 14</span>
                <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium px-3 py-1.5 rounded-md border border-green-100 dark:border-green-800/30 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Verified
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Activity size={16} className="text-indigo-600 dark:text-indigo-400" /> Performance Index
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>Precision Rate</span>
                  <span className="text-gray-900 dark:text-white">99.2%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-[99.2%] rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>Terminal Reliability</span>
                  <span className="text-gray-900 dark:text-white">96%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-400 dark:bg-gray-500 w-[96%] rounded-full"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8">
          <Card className="p-6 md:p-8">
            <form onSubmit={handleSave} className="space-y-10">
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
                  <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <User size={18} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Operational Identity</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Legal Designation</label>
                    <input 
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Terminal Access ID</label>
                    <div className="relative">
                       <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                       <input 
                        type="email" 
                        value={formData.email}
                        disabled
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800/50 border border-transparent text-gray-500 rounded-lg cursor-not-allowed" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interface Language</label>
                    <select 
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                    >
                      <option>English (International)</option>
                      <option>Spanish (ES)</option>
                      <option>French (FR)</option>
                      <option>German (DE)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Regional Synchronization</label>
                    <div className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800/50 border border-transparent text-gray-600 dark:text-gray-400 rounded-lg flex items-center gap-2">
                      <Globe size={16} /> UTC -05:00 (EST)
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
                  <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Lock size={18} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Update</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Security Key</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Security Key</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white" 
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handlePasswordUpdate}
                    disabled={passwordLoading}
                    className="flex items-center gap-2"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </section>

              <div className="pt-6 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full md:w-auto flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save size={18} />
                      Commit Protocol Updates
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Profile;
