import { User, AuthResponse } from '../types';
import { supabase } from './supabase';

/**
 * AUTH SERVICE FOR DELSU AI PROJECT
 * Connected directly to Supabase Authentication
 */

const CURRENT_USER_KEY = 'delsu_ai_current_user';

// Helper to standardise Supabase user data into your app's User type
const formatUser = (sbUser: any): User => {
  return {
    id: sbUser.id,
    fullName: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
    email: sbUser.email || '',
    role: sbUser.user_metadata?.role || 'student',
  };
};

export const authService = {
  // Register a new user in Supabase
  register: async (fullName: string, email: string, password: string, role: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed.');

    const user = formatUser(data.user);
    const token = data.session?.access_token || 'pending-email-verification';

    // Store formatted user locally for instant app initialization
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    return { user, token };
  },

  // Login existing user with Supabase
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed.');

    const user = formatUser(data.user);
    const token = data.session?.access_token || '';

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    return { user, token };
  },

  // Request password reset email from Supabase
  forgotPassword: async (email: string): Promise<string> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw new Error(error.message);
    return 'Password reset link sent.';
  },

  // Reset password action
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw new Error(error.message);
  },

  // Logout from Supabase session
  logout: async () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    await supabase.auth.signOut();
  },

  // Get current active session user
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }
};