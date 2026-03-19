import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEvent, createCheckout } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './EventDetail.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getFavs() {
  try { return JSON.parse(localStorage.getItem('guichet_favs') || '[]'); }
  catch { return []; }
}
function saveFavs(ids) { localStorage.setItem('guichet_favs', JSON.stringify(ids)); }

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event,    setEvent]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [imgError, setImgError] = useState(false);
  const [fav,      setFav]      = useState(false);
  const [qty,      setQty]      = useState(1);
  const [bookName,   setBookName]   = useState('');
  const [bookEmail,  setBookEmail]  = useState('');
  const [checking,   setChecking]   = useState(false);
  const [bookError,  setBookError]  = useState('');

  useEffect(() => {
    getEvent(id)
      .then((r) => {
        setEvent(r.data);
        setFav(getFavs().includes(r.data.id));
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user) {
      setBookName(user.name || '');
      setBookEmail(user.email || '');
    }
  }, [user]);

  function toggleFav() {
    const favs = getFavs();
    if (fav) { saveFavs(favs.filter((x) => x !== event.id)); setFav(false); }
    else      { saveFavs([...favs, event.id]);                setFav(true);  }
  }

  async function handleBuy() {
    if (!bookName.trim() || !bookEmail.trim()) {
      setBookError('Please enter your name and email');
      return;
    }
    setBookError('');
    setChecking(true);
    try {
      const res = await createCheckout({
        eventId: event.id,
        quantity: qty,
        name: bookName.trim(),
        email: bookEmail.trim(),
      });
      window.location.href = res.data.url;
    } catch (err) {
      setBookError(err.response?.data?.error || 'Payment setup failed. Try again.');
      setChecking(false);
    }
  }

  if (loading) return (
    <div className="ed-loading">
      <div className="ed-spinner" />
    </div>
  );

  if (!event) return null;

  const price      = Number(event.price);
  const isFree     = price === 0;
  const total      = isFree ? 0 : price * qty;
  const available  = event.tickets_available;
  const isSoldOut  = available !== null && available !== undefined && available <= 0;

  return (
    <main className="ed-page">

      {/* ── HERO ── */}
      <div className="ed-hero">
        {!imgError && event.image_url ? (
          <>
            <img className="ed-hero-blur" src={event.image_url} alt="" aria-hidden />
            <img className="ed-hero-img"  src={event.image_url} alt={event.title} onError={() => setImgError(true)} />
          </>
        ) : (
          <div className="ed-hero-fallback">
            <span>{event.category_icon || '🎭'}</span>
          </div>
        )}
        <div className="ed-hero-overlay" />

        <div className="ed-hero-content wrap">
          <Link to="/" className="ed-back">← Back</Link>
          <div className="ed-badges">
            {event.category_name && (
              <Link to={`/category/${event.category_slug}`} className="ed-badge ed-badge-cat">
                {event.category_icon} {event.category_name}
              </Link>
            )}
            {event.vibe_name && (
              <Link to={`/vibe/${event.vibe_slug}`} className="ed-badge ed-badge-vibe">
                {event.vibe_emoji} {event.vibe_name}
              </Link>
            )}
            {event.is_featured && <span className="ed-badge ed-badge-hot">⚡ Featured</span>}
          </div>
          <h1 className="ed-title">{event.title}</h1>
          <div className="ed-hero-meta">
            <span>📅 {formatDate(event.event_date)} · {formatTime(event.event_date)}</span>
            <span>📍 {event.city}{event.venue ? ` · ${event.venue}` : ''}</span>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="ed-body wrap">

        {/* Left — details */}
        <div className="ed-left">

          <section className="ed-section">
            <h2 className="ed-section-title">About this event</h2>
            <p className="ed-desc">
              {event.description || 'No description available for this event.'}
            </p>
          </section>

          <section className="ed-section">
            <h2 className="ed-section-title">Event details</h2>
            <div className="ed-details-grid">
              <div className="ed-detail-item">
                <div className="ed-detail-icon">📅</div>
                <div>
                  <div className="ed-detail-label">Date</div>
                  <div className="ed-detail-val">{formatDate(event.event_date)}</div>
                </div>
              </div>
              <div className="ed-detail-item">
                <div className="ed-detail-icon">🕐</div>
                <div>
                  <div className="ed-detail-label">Time</div>
                  <div className="ed-detail-val">{formatTime(event.event_date)}</div>
                </div>
              </div>
              <div className="ed-detail-item">
                <div className="ed-detail-icon">📍</div>
                <div>
                  <div className="ed-detail-label">Location</div>
                  <div className="ed-detail-val">{event.city}</div>
                  {event.venue && <div className="ed-detail-sub">{event.venue}</div>}
                </div>
              </div>
              {event.organizer && (
                <div className="ed-detail-item">
                  <div className="ed-detail-icon">🎙️</div>
                  <div>
                    <div className="ed-detail-label">Organizer</div>
                    <div className="ed-detail-val">{event.organizer}</div>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right — ticket box */}
        <aside className="ed-ticket-box">
          <div className="ed-ticket-price">
            {isFree ? (
              <span className="ed-price-free">Free entry</span>
            ) : (
              <>
                <span className="ed-price-num">{price.toFixed(0)}</span>
                <span className="ed-price-cur">{import.meta.env.VITE_CURRENCY || 'MAD'} / ticket</span>
              </>
            )}
          </div>

          {!isFree && (
            <div className="ed-qty-row">
              <span className="ed-qty-label">Quantity</span>
              <div className="ed-qty-ctrl">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(available ?? 10, q + 1))}>+</button>
              </div>
            </div>
          )}

          {!isFree && (
            <div className="ed-total-row">
              <span>Total</span>
              <span className="ed-total-val">{total.toFixed(0)} MAD</span>
            </div>
          )}

          <div className="ed-book-fields">
            <div className="ed-book-field">
              <label>Full name</label>
              <input
                type="text"
                placeholder="Your name"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
              />
            </div>
            <div className="ed-book-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={bookEmail}
                onChange={(e) => setBookEmail(e.target.value)}
              />
            </div>
          </div>

          {bookError && <div className="ed-book-error">{bookError}</div>}

          {isSoldOut ? (
            <div className="ed-urgency" style={{ background: 'rgba(220,38,38,0.12)', color: '#dc2626', borderColor: '#dc2626' }}>
              🚫 Sold out
            </div>
          ) : available > 0 && available <= 20 && (
            <div className="ed-urgency">🔥 Only {available} tickets left!</div>
          )}

          <button className="ed-btn-buy" onClick={handleBuy} disabled={checking || isSoldOut}>
            {isSoldOut ? 'Sold Out' : checking ? 'Redirecting...' : isFree ? 'Reserve my spot →' : `Buy ${qty} ticket${qty > 1 ? 's' : ''} →`}
          </button>

          <button
            className={`ed-btn-fav ${fav ? 'on' : ''}`}
            onClick={toggleFav}
          >
            {fav ? '❤️ Saved' : '🤍 Save event'}
          </button>

          <div className="ed-ticket-note">
            🔒 Secure checkout via Stripe · QR ticket sent by email
          </div>
        </aside>

      </div>
    </main>
  );
}
