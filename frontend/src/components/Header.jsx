import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import FilterModal from './FilterModal';
import './Header.css';

export default function Header() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const [theme,        setTheme]        = useState(localStorage.getItem('theme') || 'dark');
  const { user, logoutUser } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const profileRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  }

  function handleSignOut() {
    setProfileOpen(false);
    logoutUser();
    navigate('/');
  }

  return (
    <>
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <img src="/logo.png" alt="EvenTick" className="nav-logo-img" />
          <span>EvenTick</span>
        </Link>


        {/* Right icons */}
        <div className="nav-right">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <Link to="/events" className="nav-btn-sm btn-outline" title="Browse all events">
            Browse
          </Link>

          <Link to="/favorites" className="nav-icon" title="Favorites">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </Link>

          {user ? (
            <div className="nav-profile" ref={profileRef}>
              <button
                className="nav-icon nav-avatar"
                onClick={() => setProfileOpen((o) => !o)}
                title="My profile"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="pd-header">
                    <div className="pd-avatar">{user.name.charAt(0).toUpperCase()}</div>
                    <div className="pd-info">
                      <div className="pd-name">{user.name}</div>
                      <div className="pd-email">{user.email}</div>
                      {user.city && <div className="pd-city">📍 {user.city}</div>}
                    </div>
                  </div>
                  <div className="pd-divider" />
                  <Link to="/favorites" className="pd-item" onClick={() => setProfileOpen(false)}>
                    ❤️ My Favorites
                  </Link>
                  <div className="pd-divider" />
                  <button className="pd-item pd-signout" onClick={handleSignOut}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className={`btn-outline nav-btn-sm ${location.pathname === '/login' ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link to="/register" className="btn-cyan nav-btn-sm">Sign Up</Link>
              <Link
                to="/admin/login"
                className="nav-btn-sm nav-admin-btn"
                title="Admin Portal"
              >
                ⚙ Admin
              </Link>
            </>
          )}

          <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <FilterModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} />
    </>
  );
}
