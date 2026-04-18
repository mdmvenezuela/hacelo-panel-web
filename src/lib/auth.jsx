// src/lib/auth.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => setAdmin(r.data))
      .catch(() => localStorage.removeItem('admin_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('admin_token', r.data.token);
    setAdmin(r.data.admin);
    return r.data.admin;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
  };

  const can = (action) => {
    if (!admin) return false;
    const perms = {
      admin: [
        'dashboard', 'users', 'kyc', 'orders',
        'recharges', 'withdrawals', 'payment-methods', 'admins', 'zones',
      ],
      moderator: [
        'dashboard', 'users', 'kyc', 'orders',
        'recharges', 'withdrawals', 'payment-methods',
      ],
      conciliator: [
        'recharges', 'withdrawals',
      ],
    };
    return perms[admin.role]?.includes(action) ?? false;
  };

  return (
    <AuthCtx.Provider value={{ admin, loading, login, logout, can }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
