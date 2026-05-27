import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: number;
  email: string;
  role: string;
  // gymId to w rzeczywistości homeGymId, ale póki co zostanie tak dla kompatybilności
  gymId: number | null;

  memberProfile?: {
    firstName: string | null;
    lastName: string | null;
    homeGymId: number | null;
  };
  trainerProfile?: {
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    phoneNumber: string | null;
    profileImageUrl: string | null;
    tags: string[];
    socialFacebook: string | null;
    socialInstagram: string | null;
    socialDiscord: string | null;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));

        // Odśwież dane usera z backendu (np. po zmianie roli przez admina)
        fetch("http://localhost:3001/api/auth/me", {
          headers: { Authorization: `Bearer ${savedToken}` },
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((freshUser) => {
            if (freshUser && !freshUser.error) {
              setUser(freshUser);
              localStorage.setItem("user", JSON.stringify(freshUser));
            }
          })
          .catch(() => {
            /* sieć niedostępna – zostaw localStorage */
          });
      } catch (e) {
        console.error("Błąd odczytu sesji:", e);
      }
    }
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedData };
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
