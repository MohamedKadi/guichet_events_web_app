import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { getEvents, getFeaturedEvents } from '../services/api';
import './CategoryPage.css';

const TIME_TABS = [
  { label: 'All',        value: '' },
  { label: 'Today',      value: 'today' },
  { label: 'This week',  value: 'week' },
  { label: 'Weekend',    value: 'weekend' },
  { label: 'This month', value: 'month' },
];

const CATEGORY_META = {
  'concerts':        { label: 'Concerts',           icon: '🎵', color: '#1BCDE0' },
  'festivals':       { label: 'Festivals',           icon: '🎪', color: '#a855f7' },
  'theatre-humour':  { label: 'Theatre & Comedy',   icon: '🎭', color: '#f97316' },
  'cinema':          { label: 'Cinema',              icon: '🎬', color: '#ef4444' },
  'sport':           { label: 'Sports',              icon: '⚽', color: '#22c55e' },
  'divertissement':  { label: 'Entertainment',       icon: '🎠', color: '#FFC700' },
  'jeune-public':    { label: 'Kids',                icon: '👶', color: '#ec4899' },
  'salon-formation': { label: 'Exhibitions & Expos', icon: '🎓', color: '#8b5cf6' },
};

export default function CategoryPage() {
  const { slug } = useParams();
  const meta = CATEGORY_META[slug] || { label: slug, icon: '🎭', color: '#1BCDE0' };

  const [featured,   setFeatured]   = useState([]);
  const [events,     setEvents]     = useState([]);
  const [activeTime, setActiveTime] = useState('');
  const [loading,    setLoading]    = useState(true);

  // Featured events filtered to this category
  useEffect(() => {
    getFeaturedEvents()
      .then(r => setFeatured(r.data.filter(e => e.category_slug === slug)))
      .catch(() => {});
  }, [slug]);

  // All events in this category
  useEffect(() => {
    setLoading(true);
    getEvents({ category: slug, time: activeTime || undefined })
      .then(r => setEvents(r.data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [slug, activeTime]);

  return (
    <main className="cat-page">

      {/* ── Hero banner ── */}
      <div className="cat-hero" style={{ '--cat-color': meta.color }}>
        <div className="cat-hero-glow" />
        <div className="wrap cat-hero-inner">
          <div className="cat-hero-icon">{meta.icon}</div>
          <div>
            <p className="cat-hero-eyebrow">Category</p>
            <h1 className="cat-hero-title">{meta.label}</h1>
            <p className="cat-hero-sub">{events.length} event{events.length !== 1 ? 's' : ''} available</p>
          </div>
          <Link
            to={`/events?category=${slug}`}
            className="cat-view-all-btn"
          >
            View all events →
          </Link>
        </div>
      </div>

      {/* ── Featured in this category ── */}
      {featured.length > 0 && (
        <div className="wrap sec sec-sm">
          <div className="sec-head">
            <div>
              <div className="sec-label">Highlighted</div>
              <h2 className="sec-title">Featured <span>{meta.label}</span></h2>
            </div>
            <Link to={`/events?category=${slug}`} className="sec-link">View all →</Link>
          </div>
          <div className="cards-grid">
            {featured.map(ev => <EventCard key={ev.id} event={ev} />)}
          </div>
        </div>
      )}

      {/* ── All events ── */}
      <div className="wrap sec">
        <div className="sec-head">
          <div>
            <div className="sec-label">Browse</div>
            <h2 className="sec-title">All <span>{meta.label}</span> Events</h2>
          </div>
          <Link to={`/events?category=${slug}`} className="sec-link">Advanced filters →</Link>
        </div>

        {/* Time filter tabs */}
        <div className="cat-time-tabs">
          {TIME_TABS.map(t => (
            <button
              key={t.value}
              className={`cat-time-tab ${activeTime === t.value ? 'active' : ''}`}
              onClick={() => setActiveTime(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <span>{meta.icon}</span>
            <p>No {meta.label.toLowerCase()} events {activeTime ? 'for this period' : 'yet'}</p>
            <small>
              {activeTime
                ? <button className="cat-clear-time" onClick={() => setActiveTime('')}>Clear date filter</button>
                : 'Check back soon for upcoming events'}
            </small>
          </div>
        ) : (
          <div className="cards-grid">
            {events.map(ev => <EventCard key={ev.id} event={ev} />)}
          </div>
        )}
      </div>

    </main>
  );
}
