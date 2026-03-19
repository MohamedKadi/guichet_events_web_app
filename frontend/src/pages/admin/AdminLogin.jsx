import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import '../Login.css';
import './AdminLogin.css';

export default function AdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { loginAdmin }          = useAdminAuth();
  const navigate                = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/admin/login', { email, password });
      loginAdmin(res.data.admin, res.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page admin-login-page">
      <div className="auth-card admin-login-card">
        <Link to="/" className="auth-logo">EvenTick</Link>
        <div className="admin-badge">Admin Portal</div>
        <h1 className="auth-title">Admin Sign In</h1>
        <p className="auth-subtitle">Restricted access. Authorized personnel only.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="admin@guichet.ma"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary auth-submit admin-submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/" className="auth-link">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}
