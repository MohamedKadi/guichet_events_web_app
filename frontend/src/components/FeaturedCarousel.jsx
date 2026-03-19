import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './FeaturedCarousel.css';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function FeaturedCarousel({ events }) {
  const [active, setActive] = useState(0);
  const [imgErrors, setImgErrors] = useState({});

  const next = useCallback(() => {
    setActive((i) => (i + 1) % events.length);
  }, [events.length]);

  const prev = () => setActive((i) => (i - 1 + events.length) % events.length);

  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [next, events.length]);

  if (!events.length) return null;

  const bgGradients = [
    'linear-gradient(160deg, #0d2060 0%, #0a2a3a 100%)',
    'linear-gradient(160deg, #1a0d3a 0%, #0d1f4a 100%)',
    'linear-gradient(160deg, #0a2a1a 0%, #0d2040 100%)',
    'linear-gradient(160deg, #2a100d 0%, #1a0d3a 100%)',
    'linear-gradient(160deg, #0a1a3a 0%, #0d3040 100%)',
  ];

  return (
    <div className="hero-carousel">
      {events.map((ev, idx) => (
        <div
          key={ev.id}
          className={`hero-slide ${idx === active ? 'active' : ''}`}
          aria-hidden={idx !== active}
        >
          {/* Blurred background */}
          <div className="hero-bg">
            {!imgErrors[ev.id] ? (
              <img src={ev.image_url} alt="" aria-hidden="true" />
            ) : (
              <div style={{ background: bgGradients[idx % bgGradients.length], width: '100%', height: '100%' }} />
            )}
            <div className="hero-bg-overlay" />
          </div>

          {/* Content */}
          <div className="hero-content container">
            <div className="hero-info">
              <div className="hero-eyebrow">
                <span className="hero-cat-badge">{ev.category_icon} {ev.category_name}</span>
                {ev.is_trending && <span className="hero-trending-badge">🔥 Tendance</span>}
              </div>
              <h1 className="hero-title">{ev.title}</h1>
              <div className="hero-meta">
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {formatDate(ev.event_date)}
                </span>
                <span className="hero-meta-dot">·</span>
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {ev.city}
                </span>
              </div>
              {ev.description && (
                <p className="hero-desc">
                  {ev.description.slice(0, 130)}{ev.description.length > 130 ? '…' : ''}
                </p>
              )}
              <div className="hero-actions">
                <span className={`hero-price ${!Number(ev.price) ? 'free' : ''}`}>
                  {!Number(ev.price) ? 'Gratuit' : <>{Number(ev.price).toFixed(0)} <small>MAD</small></>}
                </span>
                <Link to={`/events/${ev.id}`} className="btn-primary hero-cta-btn">
                  Acheter un billet
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </div>

            <div className="hero-poster-wrap">
              {!imgErrors[ev.id] ? (
                <img
                  src={ev.image_url}
                  alt={ev.title}
                  className="hero-poster-img"
                  onError={() => setImgErrors((e) => ({ ...e, [ev.id]: true }))}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              ) : (
                <div className="hero-poster-fallback" style={{ background: bgGradients[idx % bgGradients.length] }}>
                  <span>{ev.category_icon || '🎭'}</span>
                </div>
              )}
              <div className="hero-poster-glow" />
            </div>
          </div>
        </div>
      ))}

      {/* Controls */}
      <div className="hero-controls container">
        <div className="hero-dots">
          {events.map((_, i) => (
            <button
              key={i}
              className={`hero-dot-btn ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        {events.length > 1 && (
          <div className="hero-nav-btns">
            <button className="hero-nav-btn" onClick={prev} aria-label="Précédent">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button className="hero-nav-btn" onClick={next} aria-label="Suivant">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
