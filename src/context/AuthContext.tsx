import React, { createContext, useContext, useState, ReactNode } from 'react';
import { type SystemUser } from '../data/mockData';
import * as Sentry from '@sentry/react';

interface AuthContextType {
  loggedInUser: SystemUser | null;
  login: (user: SystemUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<SystemUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [loggedInUser, setLoggedInUser] = useState<SystemUser | null>(null);

  const login = (user: SystemUser) => {
    // تحديث آخر دخول
    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString()
    };
    
    // تعيين معلومات المستخدم في Sentry
    Sentry.setUser({
      id: updatedUser.id,
      username: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.roleId
    });
    
    Sentry.addBreadcrumb({
      message: 'User logged in',
      category: 'auth',
      data: { userId: updatedUser.id, userName: updatedUser.name }
    });
    
    setLoggedInUser(updatedUser);
  };

  const logout = () => {
    Sentry.addBreadcrumb({
      message: 'User logged out',
      category: 'auth',
      data: { userId: loggedInUser?.id }
    });
    
    Sentry.setUser(null);
    setLoggedInUser(null);
  };

  const updateUser = (updates: Partial<SystemUser>) => {
    if (loggedInUser) {
      setLoggedInUser({
        ...loggedInUser,
        ...updates
      });
    }
  };

  const value = {
    loggedInUser,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};