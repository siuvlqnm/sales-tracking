'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUser, type User, clearAuth } from '@/lib/authUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    // const currentUser = await getUser();
    // setUser(currentUser);
    // setLoading(false);
    try {
      console.log('Refreshing user...');
      const currentUser = await getUser();
      console.log('Got user:', currentUser);
      
      if (!currentUser) {
        console.log('No user found, clearing auth...');
        clearAuth();
      }
      
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 