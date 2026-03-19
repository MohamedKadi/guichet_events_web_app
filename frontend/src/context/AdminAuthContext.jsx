import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { setLoading(false); return; }
    api.get('/admin/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setAdmin(res.data))
      .catch(() => localStorage.removeItem('adminToken'))
      .finally(() => setLoading(false));
  }, []);

  function loginAdmin(adminData, token) {
    localStorage.setItem('adminToken', token);
    setAdmin(adminData);
  }

  function logoutAdmin() {
    localStorage.removeItem('adminToken');
    setAdmin(null);
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
