import React, { createContext, useContext, useEffect, useState } from 'react';

import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  getCurrentUser,
  User,
  UserRole,
} from '../api/auth';

import { saveToken, getToken, removeToken } from '../storage/authStorage';

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;

  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
    role?: UserRole
  ) => Promise<void>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;

  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restoreSession();
  }, []);

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error occurred.';
    }
  }

  async function restoreSession() {
    try {
      setLoading(true);
      setError(null);

      console.log('[Auth] Restoring session...');

      const savedToken = await getToken();

      console.log('[Auth] Saved token:', savedToken ? 'FOUND' : 'NOT FOUND');

      if (!savedToken) {
        console.log('[Auth] No saved token. User is logged out.');
        return;
      }

      console.log('[Auth] Validating saved token...');

      const response = await getCurrentUser(savedToken);

      console.log('[Auth] getCurrentUser response:', response);

      if (response.success && response.data) {
        console.log('[Auth] Session restored successfully.');

        setToken(savedToken);
        setUser(response.data);
      } else {
        const message = response.message || 'Saved authentication token is invalid.';

        console.error('[Auth] Session validation failed:', message);

        await removeToken();
        setToken(null);
        setUser(null);

        setError(`Session error: ${message}`);
      }
    } catch (error) {
      const message = getErrorMessage(error);

      console.error('[Auth] restoreSession error:', error);

      await removeToken();

      setToken(null);
      setUser(null);

      setError(`Authentication startup error: ${message}`);
    } finally {
      console.log('[Auth] Finished restoring session.');

      // VERY IMPORTANT:
      // Always stop loading, even if something fails.
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      setError(null);

      console.log('[Auth] Attempting login...');

      const response = await loginApi(email, password);

      console.log('[Auth] Login API response:', response);

      if (!response.success || !response.data) {
        const message = response.message || 'Login failed.';

        console.error('[Auth] Login failed:', message);

        throw new Error(message);
      }

      const newToken = response.data.token;
      const loggedInUser = response.data.user;

      if (!newToken) {
        throw new Error('Login succeeded but the API did not return a token.');
      }

      if (!loggedInUser) {
        throw new Error('Login succeeded but the API did not return a user.');
      }

      console.log('[Auth] Login successful.', 'Role:', loggedInUser.role);

      await saveToken(newToken);

      setToken(newToken);
      setUser(loggedInUser);

      console.log('[Auth] User state updated.');
    } catch (error) {
      const message = getErrorMessage(error);

      console.error('[Auth] Login error:', error);

      setError(`Login error: ${message}`);

      throw new Error(message);
    }
  }

  async function register(
    name: string,
    email: string,
    password: string,
    phone?: string,
    role: UserRole = 'vendor'
  ) {
    try {
      setError(null);

      console.log('[Auth] Attempting registration...');

      const response = await registerApi(name, email, password, phone, role);

      console.log('[Auth] Register API response:', response);

      if (!response.success) {
        throw new Error(response.message || 'Registration failed.');
      }

      console.log('[Auth] Registration successful. Logging in...');

      await login(email, password);
    } catch (error) {
      const message = getErrorMessage(error);

      console.error('[Auth] Registration error:', error);

      setError(`Registration error: ${message}`);

      throw new Error(message);
    }
  }

  async function logout() {
    try {
      setError(null);

      console.log('[Auth] Logging out...');

      if (token) {
        await logoutApi(token);
      }
    } catch (error) {
      console.error('[Auth] Backend logout error:', error);

      // We still clear the local session.
    } finally {
      await removeToken();

      setToken(null);
      setUser(null);

      console.log('[Auth] Local session cleared.');
    }
  }

  async function refreshUser() {
    if (!token) {
      console.log('[Auth] refreshUser called without token.');
      return;
    }

    try {
      setError(null);

      console.log('[Auth] Refreshing user...');

      const response = await getCurrentUser(token);

      console.log('[Auth] refreshUser response:', response);

      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.message || 'Unable to refresh user.');
      }
    } catch (error) {
      const message = getErrorMessage(error);

      console.error('[Auth] refreshUser error:', error);

      setError(`User refresh error: ${message}`);

      await logout();
    }
  }

  function clearError() {
    setError(null);
  }

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        error,
        login,
        register,
        logout,
        refreshUser,
        clearError,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
