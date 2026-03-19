import { useState } from 'react';
import { Link } from 'react-router-dom';
import './EventCard.css';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getFavs() {
  try { return JSON.parse(localStorage.getItem('guichet_favs') || '[]'); }
  catch { return []; }
}
function saveFavs(ids) {
  localStorage.setItem('guichet_favs', JSON.stringify(ids));
}

export default function EventCard({ event, onUnfavorite }) {
  const [fav, setFav] = useState(() => getFavs().includes(event.id));
  const [imgError, setImgError] = useState(false);

  const price     = Number(event.price);
  const available = event.tickets_available;
  const isSoldOut = available !== null && available !== undefined && available <= 0;
  const isLow     = !isSoldOut && available !== null && available !== undefined && available <= 20;

  function toggleFav(e) {
    e.preventDefault();
    e.stopPropagation();
    const favs = getFavs();
    if (fav) {
      saveFavs(favs.filter((id) => id !== event.id));
      setFav(false);
      onUnfavorite?.(event.id);
    } else {
      saveFavs([...favs, event.id]);
      setFav(true);
    }
  }

  const gradients = [
    'linear-gradient(160deg,#0d2060 0%,#0a3040 100%)',
    'linear-gradient(160deg,#1a0d3a 0%,#0d204a 100%)',
    'linear-gradient(160deg,#0a2a1a 0%,#0d2040 100%)',
    'linear-gradient(160deg,#2a0d0d 0%,#1a0d3a 100%)',
    'linear-gradient(160deg,#0a1a3a 0%,#0d3a40 100%)',
  ];
  const fallbackGrad = gradients[event.id % gradients.length];

  return (
    <Link to={`/events/${event.id}`} className={`ecard${isSoldOut ? ' is-soldout' : ''}`}>
      {/* Thumbnail */}
      <div className="ecard-thumb" style={imgError ? { background: fallbackGrad } : {}}>
        {!imgError ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="ecard-thumb-bg"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="ecard-thumb-bg ecard-fallback">
            {event.category_icon || '🎭'}
          </div>
        )}
        <div className="ecard-overlay" />
        <div className="ecard-cat-tag">{event.category_name}</div>
        <button
          className={`ecard-wish ${fav ? 'on' : ''}`}
          onClick={toggleFav}
          aria-label="Save"
        >
          {fav ? '❤️' : '🤍'}
        </button>
        {event.is_trending && !isSoldOut && <div className="ecard-hot-badge">🔥 Hot</div>}
        {isSoldOut && <div className="ecard-soldout-overlay"><span>SOLD OUT</span></div>}
      </div>

      {/* Body */}
      <div className="ecard-body">
        <div className="ecard-meta">
          <span>📅 {formatDate(event.event_date)}</span>
          <div className="ecard-dot" />
          <span>📍 {event.city}</span>
        </div>
        <h3 className="ecard-title">{event.title}</h3>
        {available !== null && available !== undefined && (
          <div className={`ecard-avail ${isSoldOut ? 'sold' : isLow ? 'low' : ''}`}>
            {isSoldOut
              ? '🚫 Sold out'
              : isLow
                ? `⚡ Only ${available} ticket${available === 1 ? '' : 's'} left!`
                : `🎟 ${available} place${available === 1 ? '' : 's'} available`
            }
          </div>
        )}
        <div className="ecard-foot">
          <div className="ecard-price">
            {!price ? (
              <span className="ecard-free">Free</span>
            ) : (
              <>{price.toFixed(0)} <small>MAD</small></>
            )}
          </div>
          <div className="ecard-actions">
            <button className="btn-details">Details</button>
            {isSoldOut
              ? <button className="btn-soldout" disabled>Sold Out</button>
              : <button className="btn-buy-sm">Buy</button>
            }
          </div>
        </div>
      </div>
    </Link>
  );
}
