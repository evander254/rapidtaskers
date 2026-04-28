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
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
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
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
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
      // Note: IP address is typically handled server-side in Supabase (e.g., via Edge Functions or Triggers),
      // but we can log user agent here for basic tracking.
      try {
        await supabase.from('login_logs').insert({
          user_id: data.user.id,
          user_agent: navigator.userAgent
          // ip_address would ideally be captured by a DB trigger on insertion or via a function
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
