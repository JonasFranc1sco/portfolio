import * as React from 'react';
import { authApi } from '../api/auth.api';

const AUTH_STORAGE_KEY = 'portfolio_is_authenticated';
const THEME_STORAGE_KEY = 'portfolio_theme_dark';

interface AuthContextValue {
  isAuthenticated: boolean;
  isDarkMode: boolean;
  markAuthenticated: () => void;
  clearAuthenticated: () => void;
  logout: () => Promise<void>;
  toggleDarkMode: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(() => {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  });

  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved !== null) return saved === 'true';
    return document.documentElement.classList.contains('dark-mode');
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
    localStorage.setItem(THEME_STORAGE_KEY, String(isDarkMode));
  }, [isDarkMode]);

  const markAuthenticated = React.useCallback(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    setIsAuthenticated(true);
  }, []);

  const clearAuthenticated = React.useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  }, []);

  React.useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setIsAuthenticated(false);
    };
    window.addEventListener('portfolio:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('portfolio:unauthorized', handleUnauthorized);
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuthenticated();
    }
  }, [clearAuthenticated]);

  const toggleDarkMode = React.useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isDarkMode,
        markAuthenticated,
        clearAuthenticated,
        logout,
        toggleDarkMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return ctx;
}
