import { create } from 'zustand';
import { supabase } from '../services/supabase';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  initialize: async () => {
    const { initialized } = useAuthStore.getState();
    if (initialized) return;
    set({ initialized: true });

    try {
      // 1. Check current session immediately
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        let { data: profile } = await supabase
          .from('profiles')
          .select('*, wallets(balance_available, balance_pending)')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.wallets) {
          const walletData = Array.isArray(profile.wallets) ? profile.wallets[0] : profile.wallets;
          if (walletData) {
            profile.balance_available = walletData.balance_available || 0;
            profile.balance_pending = walletData.balance_pending || 0;
          }
        }
        set({ user: session.user, profile, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }
    } catch (err) {
      console.error('Initialization error:', err);
      set({ user: null, profile: null, loading: false });
    }

    // 2. Set up listener for future changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        let { data: profile } = await supabase
          .from('profiles')
          .select('*, wallets(balance_available, balance_pending)')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.wallets) {
          const walletData = Array.isArray(profile.wallets) ? profile.wallets[0] : profile.wallets;
          if (walletData) {
            profile.balance_available = walletData.balance_available || 0;
            profile.balance_pending = walletData.balance_pending || 0;
          }
        }
        set({ user: session.user, profile, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }
      
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/reset-password';
      }
    });
  },
  signOut: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    set({ user: null, profile: null, loading: false });
    // Force redirect to login or home
    window.location.href = '/';
  },
  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    
    if (error) throw error;
    
    if (data.user) {
      // Create profile record
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        role: 'tasker',
        status: 'pending'
      });
      
      if (profileError) console.error('Error creating profile:', profileError);
    }
    
    return data;
  },
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    if (data.user) {
      // Log login (anti-multi account)
      try {
        let fp = localStorage.getItem('rt_device_fp');
        if (!fp) {
          fp = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          localStorage.setItem('rt_device_fp', fp);
        }
        await supabase.from('login_logs').insert({
          user_id: data.user.id,
          user_agent: navigator.userAgent,
          device_fingerprint: fp
        });
      } catch (logError) {
        console.error('Error logging login:', logError);
      }
    }
    
    return data;
  },
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  }
}));
