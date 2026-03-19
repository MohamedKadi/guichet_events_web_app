import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import './AdminDashboard.css';

// ─── QR Scanner Tab ───────────────────────────────────────────────────────────
function QRScanner() {
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const canvasRef             = useRef(null);
  const token                 = localStorage.getItem('adminToken');

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setResult(null);
    setError('');
    setPreview(URL.createObjectURL(file));

    // Decode QR from image using canvas + jsQR
    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, imageData.width, imageData.height);
      if (!code) {
        setError('No QR code detected in the image. Try a clearer photo.');
        return;
      }

      // QR data is JSON — extract the token field
      let qrToken = code.data;
      try {
        const parsed = JSON.parse(code.data);
        if (parsed.token) qrToken = parsed.token;
      } catch {
        // not JSON, use raw value as-is
      }
      setLoading(true);
      try {
        const res = await api.get(`/admin/verify-ticket/${encodeURIComponent(qrToken)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResult(res.data);
      } catch (err) {
        setResult(err.response?.data || { valid: false, error: 'Verification failed' });
      } finally {
        setLoading(false);
      }
    };
    img.src = URL.createObjectURL(file);
  }

  function reset() {
    setResult(null);
    setError('');
    setPreview(null);
  }

  return (
    <div className="ad-section">
      <div className="ad-section-header">
        <h2 className="ad-section-title">Scan Ticket QR Code</h2>
        <p className="ad-section-sub">Upload a QR code image to validate a booking ticket.</p>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!result ? (
        <div className="qr-upload-area">
          {preview ? (
            <div className="qr-preview-wrap">
              <img src={preview} alt="QR Preview" className="qr-preview-img" />
              {loading && (
                <div className="qr-scanning-overlay">
                  <div className="qr-scan-line" />
                  <span>Scanning...</span>
                </div>
              )}
            </div>
          ) : (
            <label className="qr-drop-zone" htmlFor="qr-file-input">
              <div className="qr-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <path d="M14 14h2v2h-2zM16 16h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>
                </svg>
              </div>
              <p className="qr-drop-text">Click to upload QR code image</p>
              <p className="qr-drop-sub">PNG, JPG, WEBP supported</p>
            </label>
          )}
          <input
            id="qr-file-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          {error && (
            <div className="qr-error">
              <span>⚠️</span> {error}
              <button className="qr-retry-btn" onClick={reset}>Try again</button>
            </div>
          )}
        </div>
      ) : (
        <div className={`qr-result ${result.valid ? 'qr-result-valid' : 'qr-result-invalid'}`}>
          <div className="qr-result-icon">
            {result.valid ? (
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            ) : (
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
          </div>
          <h3 className="qr-result-status">
            {result.valid ? 'Ticket Valid ✓' : 'Ticket Invalid'}
          </h3>
          {result.error && <p className="qr-result-msg">{result.error}</p>}
          {result.booking && (
            <div className="qr-booking-details">
              <div className="qr-detail-row">
                <span className="qr-detail-label">Event</span>
                <span className="qr-detail-value">{result.booking.event_title}</span>
              </div>
              <div className="qr-detail-row">
                <span className="qr-detail-label">Name</span>
                <span className="qr-detail-value">{result.booking.name}</span>
              </div>
              <div className="qr-detail-row">
                <span className="qr-detail-label">Email</span>
                <span className="qr-detail-value">{result.booking.email}</span>
              </div>
              <div className="qr-detail-row">
                <span className="qr-detail-label">Quantity</span>
                <span className="qr-detail-value">{result.booking.quantity}</span>
              </div>
              <div className="qr-detail-row">
                <span className="qr-detail-label">Amount Paid</span>
                <span className="qr-detail-value">{result.booking.amount_paid} MAD</span>
              </div>
              <div className="qr-detail-row">
                <span className="qr-detail-label">Status</span>
                <span className={`qr-status-pill qr-status-${result.booking.status}`}>
                  {result.booking.status}
                </span>
              </div>
              <div className="qr-detail-row">
                <span className="qr-detail-label">Venue</span>
                <span className="qr-detail-value">{result.booking.venue}</span>
              </div>
              <div className="qr-detail-row">
                <span className="qr-detail-label">Date</span>
                <span className="qr-detail-value">
                  {new Date(result.booking.event_date).toLocaleString('fr-MA')}
                </span>
              </div>
            </div>
          )}
          <button className="qr-retry-btn qr-scan-another" onClick={reset}>
            Scan Another Ticket
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add Event Tab ────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: '', description: '', category_id: '', vibe_id: '',
  city: '', venue: '', event_date: '', price: '',
  image_url: '', organizer: '', is_featured: false,
  is_trending: false, tickets_available: ''
};

function AddEvent() {
  const token = localStorage.getItem('adminToken');
  const [categories, setCategories] = useState([]);
  const [vibes, setVibes]           = useState([]);
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [form, setForm]             = useState({ ...EMPTY_FORM });

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      api.get('/admin/categories', { headers }),
      api.get('/admin/vibes', { headers })
    ]).then(([catRes, vibeRes]) => {
      setCategories(catRes.data);
      setVibes(vibeRes.data);
    }).catch(() => {});
  }, [token]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!form.category_id) return setError('Please select a category.');
    if (!form.vibe_id)     return setError('Please select a vibe.');

    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        tickets_available: parseInt(form.tickets_available)
      };
      const res = await api.post('/admin/events', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Event "${res.data.title}" created successfully!`);
      setForm({ ...EMPTY_FORM });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ad-section">
      <div className="ad-section-header">
        <h2 className="ad-section-title">Add New Event</h2>
        <p className="ad-section-sub">All fields are required.</p>
      </div>

      {success && <div className="ad-success">{success}</div>}
      {error   && <div className="ad-error">{error}</div>}

      <form className="ad-form" onSubmit={handleSubmit}>
        <div className="ad-form-grid">
          <div className="form-group ad-full">
            <label>Event Title *</label>
            <input
              className="form-input"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Mawazine Festival 2026"
              required
            />
          </div>

          <div className="form-group ad-full">
            <label>Description *</label>
            <textarea
              className="form-input ad-textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the event..."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              className="form-input form-select"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
            >
              <option value="">— Select category —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Vibe *</label>
            <select
              className="form-input form-select"
              name="vibe_id"
              value={form.vibe_id}
              onChange={handleChange}
              required
            >
              <option value="">— Select vibe —</option>
              {vibes.map(v => (
                <option key={v.id} value={v.id}>{v.emoji} {v.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>City *</label>
            <input
              className="form-input"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="e.g. Casablanca"
              required
            />
          </div>

          <div className="form-group">
            <label>Venue *</label>
            <input
              className="form-input"
              name="venue"
              value={form.venue}
              onChange={handleChange}
              placeholder="e.g. Complexe Mohammed V"
              required
            />
          </div>

          <div className="form-group">
            <label>Event Date & Time *</label>
            <input
              className="form-input"
              type="datetime-local"
              name="event_date"
              value={form.event_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Price (MAD) *</label>
            <input
              className="form-input"
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="e.g. 200"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Tickets Available *</label>
            <input
              className="form-input"
              type="number"
              name="tickets_available"
              value={form.tickets_available}
              onChange={handleChange}
              placeholder="e.g. 100"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Organizer *</label>
            <input
              className="form-input"
              name="organizer"
              value={form.organizer}
              onChange={handleChange}
              placeholder="e.g. Méydene"
              required
            />
          </div>

          <div className="form-group ad-full">
            <label>Image URL *</label>
            <input
              className="form-input"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="https://..."
              required
            />
          </div>

          <div className="ad-checkboxes">
            <label className="ad-checkbox-label">
              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
              />
              <span className="ad-checkbox-custom" />
              Featured event
            </label>
            <label className="ad-checkbox-label">
              <input
                type="checkbox"
                name="is_trending"
                checked={form.is_trending}
                onChange={handleChange}
              />
              <span className="ad-checkbox-custom" />
              Trending event
            </label>
          </div>
        </div>

        <button type="submit" className="ad-submit-btn" disabled={loading}>
          {loading ? 'Creating event...' : '+ Publish Event'}
        </button>
      </form>
    </div>
  );
}

// ─── Dashboard Shell ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab]       = useState('add-event');
  const { admin, logoutAdmin } = useAdminAuth();
  const navigate             = useNavigate();

  function handleLogout() {
    logoutAdmin();
    navigate('/admin/login');
  }

  return (
    <div className="ad-layout">
      {/* Sidebar */}
      <aside className="ad-sidebar">
        <div className="ad-sidebar-logo">
          <img src="/logo.png" alt="EvenTick" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />
          <span className="ad-logo-text">EvenTick</span>
          <span className="ad-logo-badge">Admin</span>
        </div>

        <nav className="ad-nav">
          <button
            className={`ad-nav-item ${tab === 'add-event' ? 'active' : ''}`}
            onClick={() => setTab('add-event')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Add Event
          </button>

          <button
            className={`ad-nav-item ${tab === 'qr-scanner' ? 'active' : ''}`}
            onClick={() => setTab('qr-scanner')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>
            </svg>
            Scan QR Ticket
          </button>
        </nav>

        <div className="ad-sidebar-footer">
          <div className="ad-admin-info">
            <div className="ad-admin-avatar">{admin?.name?.charAt(0).toUpperCase()}</div>
            <div className="ad-admin-meta">
              <div className="ad-admin-name">{admin?.name}</div>
              <div className="ad-admin-email">{admin?.email}</div>
            </div>
          </div>
          <button className="ad-logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ad-main">
        <div className="ad-topbar">
          <h1 className="ad-topbar-title">
            {tab === 'add-event' ? 'Add Event' : 'QR Ticket Scanner'}
          </h1>
          <span className="ad-topbar-date">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <div className="ad-content">
          {tab === 'add-event'   && <AddEvent />}
          {tab === 'qr-scanner'  && <QRScanner />}
        </div>
      </main>
    </div>
  );
}
