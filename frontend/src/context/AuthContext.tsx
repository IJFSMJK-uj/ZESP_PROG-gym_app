import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  userEmail: string | null;
  login: (token: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) setUserEmail(savedEmail);
  }, []);

  const login = (token: string, email: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
    setUserEmail(email);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};