import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, UserRole, PermissionResource } from '../types/index.ts';
import { api } from '../services/api.ts';

export interface LoginCredentials {
  username?: string;
  email?: string;
  studentId?: string;
  registerNumber?: string;
  password?: string;
  role?: UserRole;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ redirectUrl: string; user: User }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  can: (resource: PermissionResource, action?: 'view' | 'create' | 'edit' | 'delete' | 'mark' | 'update_gps') => boolean;
  sessionTimeRemaining: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 30 minutes session inactivity timeout (in seconds)
const SESSION_TIMEOUT_SECONDS = 30 * 60;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(SESSION_TIMEOUT_SECONDS);
  const lastActivityRef = useRef<number>(Date.now());

  // Check existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('mybus_token');
    if (!savedToken) {
      // Auto-initialize demo student for immediate preview
      switchRole('ROLE_STUDENT');
      return;
    }

    api
      .getCurrentUser()
      .then((res) => {
        if (res.user) {
          setUser(res.user);
          localStorage.setItem('mybus_role', res.user.role);
        } else {
          switchRole('ROLE_STUDENT');
        }
      })
      .catch(() => {
        switchRole('ROLE_STUDENT');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Inactivity detection & session countdown
  useEffect(() => {
    if (!user) return;

    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now();
      setSessionTimeRemaining(SESSION_TIMEOUT_SECONDS);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetInactivityTimer, { passive: true }));

    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = SESSION_TIMEOUT_SECONDS - elapsedSeconds;

      if (remaining <= 0) {
        // Session timed out due to inactivity
        logout();
      } else {
        setSessionTimeRemaining(remaining);
      }
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
      clearInterval(timer);
    };
  }, [user]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await api.login({
        username: credentials.username || credentials.studentId || credentials.email,
        email: credentials.email,
        studentId: credentials.studentId,
        password: credentials.password,
        role: credentials.role,
      });

      localStorage.setItem('mybus_token', res.token);
      localStorage.setItem('mybus_role', res.role);
      setUser(res.user);
      lastActivityRef.current = Date.now();
      setSessionTimeRemaining(SESSION_TIMEOUT_SECONDS);

      return {
        redirectUrl: res.redirectUrl,
        user: res.user,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('mybus_token');
      localStorage.removeItem('mybus_role');
      setUser(null);
    }
  };

  // Helper for quick demo role testing
  const switchRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      let username = 'admin';
      let password = 'admin123';

      if (targetRole === 'ROLE_SUPER_ADMIN') {
        username = 'admin';
        password = 'admin123';
      } else if (targetRole === 'ROLE_COLLEGE_ADMIN' || targetRole === 'ROLE_ADMIN') {
        username = 'collegeadmin';
        password = 'admin123';
      } else if (targetRole === 'ROLE_DRIVER') {
        username = 'driver01';
        password = 'driver123';
      } else if (targetRole === 'ROLE_STUDENT') {
        username = 'student01';
        password = 'student123';
      } else if (targetRole === 'ROLE_PARENT') {
        username = 'parent01';
        password = 'student123';
      }

      const res = await api.login({ username, password, role: targetRole });
      localStorage.setItem('mybus_token', res.token);
      localStorage.setItem('mybus_role', res.user.role);
      setUser(res.user);
      lastActivityRef.current = Date.now();
      setSessionTimeRemaining(SESSION_TIMEOUT_SECONDS);
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // RBAC Permission Check Helper (can this role perform action on resource?)
  const can = useCallback(
    (resource: PermissionResource, action: 'view' | 'create' | 'edit' | 'delete' | 'mark' | 'update_gps' = 'view'): boolean => {
      if (!user) return false;
      const r = user.role;

      // 1. Super Admin: full access to everything
      if (r === 'ROLE_SUPER_ADMIN') return true;

      // 2. College Admin: full access except cannot manage Super Admins in user_management
      if (r === 'ROLE_COLLEGE_ADMIN' || r === 'ROLE_ADMIN') {
        if (resource === 'user_management' && (action === 'delete' || action === 'create')) {
          return true; // Can manage non-superadmin users
        }
        return true;
      }

      // 3. Driver:
      if (r === 'ROLE_DRIVER') {
        if (resource === 'dashboard') return action === 'view';
        if (resource === 'buses' || resource === 'routes') return action === 'view';
        if (resource === 'students') return action === 'view';
        if (resource === 'gps_tracking') return action === 'view' || action === 'update_gps';
        if (resource === 'attendance') return action === 'view' || action === 'mark';
        if (resource === 'reports') return action === 'view';
        return false;
      }

      // 4. Student:
      if (r === 'ROLE_STUDENT') {
        if (resource === 'dashboard') return action === 'view';
        if (resource === 'students') return action === 'view';
        if (resource === 'buses' || resource === 'routes' || resource === 'gps_tracking' || resource === 'attendance') {
          return action === 'view';
        }
        return false;
      }

      // 5. Parent:
      if (r === 'ROLE_PARENT') {
        return action === 'view';
      }

      return false;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'ROLE_STUDENT',
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
        can,
        sessionTimeRemaining,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
