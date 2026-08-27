
import { User, AuthResponse } from '../types';

/**
 * AUTH SERVICE FOR DELSU AI PROJECT
 * In a production environment, these methods would call a Node.js/Express API.
 * For this implementation, we use localStorage to simulate a database.
 */

const USERS_DB_KEY = 'delsu_ai_users_db';
const AUTH_TOKEN_KEY = 'delsu_ai_auth_token';
const CURRENT_USER_KEY = 'delsu_ai_current_user';

export const authService = {
  // Register a new user
  register: async (fullName: string, email: string, password: string, role: string): Promise<AuthResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const db = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    
    if (db.find((u: any) => u.email === email)) {
      throw new Error('User with this email already exists.');
    }

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      fullName,
      email,
      password: btoa(password), // Simple simulation of hashing
      role,
      resetToken: null,
      resetTokenExpiry: null
    };

    db.push(newUser);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));

    const response: AuthResponse = {
      user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email, role: newUser.role as any },
      token: 'jwt-simulated-' + newUser.id
    };

    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));
    
    return response;
  },

  // Login existing user
  login: async (email: string, password: string): Promise<AuthResponse> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const db = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const user = db.find((u: any) => u.email === email && u.password === btoa(password));

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const response: AuthResponse = {
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role as any },
      token: 'jwt-simulated-' + user.id
    };

    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));
    
    return response;
  },

  // --- NEW: FORGOT PASSWORD REQUEST ---
  forgotPassword: async (email: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const db = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const userIndex = db.findIndex((u: any) => u.email === email);

    if (userIndex === -1) {
      throw new Error('No account found with that email address.');
    }

    // Generate secure token and 15-min expiry
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiry = Date.now() + 15 * 60 * 1000;

    db[userIndex].resetToken = token;
    db[userIndex].resetTokenExpiry = expiry;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));

    // MOCK EMAIL LOGGING
    console.log("%c--- DELSU AI SECURE MAIL SYSTEM ---", "color: #2563eb; font-weight: bold;");
    console.log(`To: ${email}`);
    console.log(`Subject: Password Reset Request`);
    console.log(`Click this token to reset: ${token}`);
    console.log("%c-----------------------------------", "color: #2563eb; font-weight: bold;");

    return token;
  },

  // --- NEW: RESET PASSWORD ACTION ---
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const db = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const userIndex = db.findIndex((u: any) => 
      u.resetToken === token && u.resetTokenExpiry > Date.now()
    );

    if (userIndex === -1) {
      throw new Error('Invalid or expired reset token.');
    }

    // Update password and clear tokens
    db[userIndex].password = btoa(newPassword);
    db[userIndex].resetToken = null;
    db[userIndex].resetTokenExpiry = null;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
  },

  // Logout
  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // Get current session
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }
};
