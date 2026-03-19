import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { getEvents } from '../services/api';
import './Home.css';

const TIME_TABS = [
  { label: 'All',        value: 'all'     },
  { label: 'Today',      value: 'today'   },
  { label: 'This week',  value: 'week'    },
  { label: 'Weekend',    value: 'weekend' },
  { label: 'This month', value: 'month'   },
];

const VIBE_LABELS = {
  'party':   'Party 🎉',
  'romance': 'Romance 💘',
  'sports':  'Sports 🏆',
  'chill':   'Chill 😌',
  'culture': 'Culture 🎭',
};

const VIBE_EMOJIS = {
  'party':   '🎉',
  'romance': '💘',
  'sports':  '🏆',
  'chill':   '😌',
  'culture': '🎭',
};

export default function VibePage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [activeTime, setActiveTime] = useState(searchParams.get('time') || 'all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getEvents({ vibe: slug, time: activeTime === 'all' ? undefined : activeTime })
      .then((r) => setEvents(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, activeTime]);

  const vibeLabel = VIBE_LABELS[slug] || slug;
  const vibeEmoji = VIBE_EMOJIS[slug] || '✨';

  return (
    <main className="home">
      <div className="category-hero">
        <div className="category-hero-emoji">{vibeEmoji}</div>
        <h1 className="category-hero-title">{vibeLabel}</h1>
        <p className="category-hero-sub">Discover events that match this vibe</p>
      </div>

      <div className="time-tabs-wrapper">
        <div className="time-tabs">
          {TIME_TABS.map((tab) => (
            <button
              key={tab.value}
              className={`time-tab ${activeTime === tab.value ? 'active' : ''}`}
              onClick={() => setActiveTime(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container home-content">
        <section className="events-section">
          <h2 className="section-title">{vibeLabel}</h2>

          {loading ? (
            <div className="events-skeleton">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <span>{vibeEmoji}</span>
              <p>No events for this vibe yet</p>
              <small>Check back soon for upcoming events</small>
            </div>
          ) : (
            <div className="cards-grid">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
