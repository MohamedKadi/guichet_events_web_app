import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  }

  function handleLogout() {
    logoutUser();
    onClose();
    navigate('/');
  }

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">EvenTick</span>
          <button className="sidebar-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="sidebar-auth">
          {user ? (
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="sidebar-username">{user.name}</p>
                <p className="sidebar-email">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="sidebar-auth-btns">
              <Link to="/login" className="sidebar-auth-btn sidebar-login-btn" onClick={onClose}>
                Login
              </Link>
              <Link to="/register" className="sidebar-auth-btn sidebar-signup-btn" onClick={onClose}>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {user && (
            <>
              <Link to="/favorites" className="sidebar-link" onClick={onClose}>
                <span>❤️</span> Favorites
              </Link>
              <div className="sidebar-divider" />
            </>
          )}

          <Link to="/events" className="sidebar-link" onClick={onClose}>
            <span>🎟️</span> Browse All Events
          </Link>

          <button className="sidebar-link" onClick={toggleTheme}>
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          <div className="sidebar-divider" />

          <p className="sidebar-section-title">Support</p>
          <a href="#" className="sidebar-link">
            <span>📞</span> Contact Support
          </a>
          <a href="#" className="sidebar-link">
            <span>❓</span> FAQ
          </a>
          <a href="#" className="sidebar-link">
            <span>↩️</span> Refund Policy
          </a>

          <div className="sidebar-divider" />

          <p className="sidebar-section-title">About</p>
          <a href="#" className="sidebar-link">
            <span>ℹ️</span> About EvenTick
          </a>

          {!user && (
            <>
              <div className="sidebar-divider" />
              <Link to="/admin/login" className="sidebar-link" onClick={onClose}>
                <span>⚙</span> Admin Portal
              </Link>
            </>
          )}

          {user && (
            <>
              <div className="sidebar-divider" />
              <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
                <span>🚪</span> Sign Out
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-section-title">Follow us</p>
          <div className="sidebar-social">
            <a href="#" className="social-icon" aria-label="Facebook">f</a>
            <a href="#" className="social-icon" aria-label="Instagram">📷</a>
            <a href="#" className="social-icon" aria-label="X">𝕏</a>
            <a href="#" className="social-icon" aria-label="LinkedIn">in</a>
          </div>

          <p className="sidebar-section-title" style={{ marginTop: '16px' }}>Download the app</p>
          <div className="sidebar-apps">
            <a href="#" className="app-btn">
              <span>🍎</span> App Store
            </a>
            <a href="#" className="app-btn">
              <span>▶</span> Google Play
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
