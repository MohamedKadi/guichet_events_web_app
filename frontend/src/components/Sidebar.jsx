import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

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
              <Link to="/account" className="sidebar-link" onClick={onClose}>
                <span>👤</span> My Account
              </Link>
              <Link to="/favorites" className="sidebar-link" onClick={onClose}>
                <span>❤️</span> Favorites
              </Link>
              <Link to="/cart" className="sidebar-link" onClick={onClose}>
                <span>🛒</span> My Cart
              </Link>
              <div className="sidebar-divider" />
            </>
          )}

          <Link to="/events" className="sidebar-link" onClick={onClose}>
            <span>🎟️</span> Browse All Events
          </Link>

          <div className="sidebar-divider" />

          <p className="sidebar-section-title">Support</p>
          <Link to="/contact" className="sidebar-link" onClick={onClose}>
            <span>📞</span> Contact Support
          </Link>
          <Link to="/faq" className="sidebar-link" onClick={onClose}>
            <span>❓</span> FAQ
          </Link>
          <Link to="/refunds" className="sidebar-link" onClick={onClose}>
            <span>↩️</span> Refund Policy
          </Link>

          <div className="sidebar-divider" />

          <p className="sidebar-section-title">About</p>
          <Link to="/about" className="sidebar-link" onClick={onClose}>
            <span>ℹ️</span> About EvenTick
          </Link>

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
