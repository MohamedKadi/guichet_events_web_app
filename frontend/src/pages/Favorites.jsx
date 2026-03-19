import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { getEvent } from '../services/api';
import './Favorites.css';

function getFavIds() {
  try { return JSON.parse(localStorage.getItem('guichet_favs') || '[]'); }
  catch { return []; }
}

export default function Favorites() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getFavIds();
    if (ids.length === 0) { setLoading(false); return; }

    Promise.allSettled(ids.map((id) => getEvent(id)))
      .then((results) => {
        const loaded = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value.data);
        setEvents(loaded);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="fav-page">
      <div className="wrap">
        <div className="fav-header">
          <div className="sec-label">Saved</div>
          <h1 className="fav-title">My Favorites <span>❤️</span></h1>
          <p className="fav-sub">Events you saved — all in one place.</p>
        </div>

        {loading ? (
          <div className="skeleton-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="fav-empty">
            <div className="fav-empty-icon">🤍</div>
            <p>No favorites yet</p>
            <small>Tap the heart on any event to save it here</small>
            <Link to="/" className="btn-cyan fav-browse-btn">Browse events →</Link>
          </div>
        ) : (
          <>
            <p className="fav-count">{events.length} saved event{events.length !== 1 ? 's' : ''}</p>
            <div className="cards-grid">
              {events.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onUnfavorite={(id) => setEvents(prev => prev.filter(e => e.id !== id))}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
