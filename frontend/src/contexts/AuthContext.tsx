import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
}

export interface Permissions {
  dashboard: boolean;
  users: boolean;
  customers: boolean;
  products: boolean;
  challans: boolean;
  inventory: boolean;
  accounts: boolean;
  reports: boolean;
  settings: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getRolePermissions = (role: User['role']): Permissions => {
  const all: Permissions = {
    dashboard: true,
    users: true,
    customers: true,
    products: true,
    challans: true,
    inventory: true,
    accounts: true,
    reports: true,
    settings: true,
  };

  switch (role) {
    case 'ADMIN':
      return all;
    case 'SALES':
      return {
        dashboard: true,
        users: false,
        customers: true,
        products: true,
        challans: true,
        inventory: false,
        accounts: false,
        reports: true,
        settings: false,
      };
    case 'WAREHOUSE':
      return {
        dashboard: true,
        users: false,
        customers: false,
        products: true,
        challans: true,
        inventory: true,
        accounts: false,
        reports: false,
        settings: false,
      };
    case 'ACCOUNTS':
      return {
        dashboard: true,
        users: false,
        customers: true,
        products: false,
        challans: true,
        inventory: false,
        accounts: true,
        reports: true,
        settings: false,
      };
    default:
      return {
        dashboard: false,
        users: false,
        customers: false,
        products: false,
        challans: false,
        inventory: false,
        accounts: false,
        reports: false,
        settings: false,
      };
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
