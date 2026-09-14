import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR';
  requiresPasswordChange: boolean;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMe = async () => {
    const token = localStorage.getItem('toktickit_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      navigate('/login', { replace: true });
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Sync legacy requester for api.ts compatibility
        localStorage.setItem('toktickit_requester', JSON.stringify({ id: data.user.id, name: data.user.name }));
      } else {
        localStorage.removeItem('toktickit_token');
        localStorage.removeItem('toktickit_requester');
        setUser(null);
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
      setUser(null);
      navigate('/login', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('toktickit_token', token);
    localStorage.setItem('toktickit_requester', JSON.stringify({ id: userData.id, name: userData.name }));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('toktickit_token');
    localStorage.removeItem('toktickit_requester');
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, fetchMe }}>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-zenBg">
          <div className="text-zenPrimary font-semibold animate-pulse">Loading TokTickIT...</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
