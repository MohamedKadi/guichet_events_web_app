import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { getEvents, getCategories, getVibes } from '../services/api';
import './BrowsePage.css';

const TIME_TABS = [
  { label: 'All dates',  value: '' },
  { label: 'Today',      value: 'today' },
  { label: 'This week',  value: 'week' },
  { label: 'Weekend',    value: 'weekend' },
  { label: 'This month', value: 'month' },
];

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state — initialise from URL
  const [search,    setSearch]    = useState(searchParams.get('search')   || '');
  const [category,  setCategory]  = useState(searchParams.get('category') || '');
  const [vibe,      setVibe]      = useState(searchParams.get('vibe')     || '');
  const [time,      setTime]      = useState(searchParams.get('time')     || '');
  const [minPrice,  setMinPrice]  = useState(searchParams.get('min_price') || '');
  const [maxPrice,  setMaxPrice]  = useState(searchParams.get('max_price') || '');

  const [events,     setEvents]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [vibes,      setVibes]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);

  // Load categories & vibes once
  useEffect(() => {
    getCategories().then(r => setCategories(r.data)).catch(() => {});
    getVibes().then(r => setVibes(r.data)).catch(() => {});
  }, []);

  // Sync URL → state when user navigates back/forward
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || '');
    setVibe(searchParams.get('vibe') || '');
    setTime(searchParams.get('time') || '');
    setMinPrice(searchParams.get('min_price') || '');
    setMaxPrice(searchParams.get('max_price') || '');
  }, [searchParams]);

  // Fetch events whenever filters change
  const fetchEvents = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search)   params.search    = search;
    if (category) params.category  = category;
    if (vibe)     params.vibe      = vibe;
    if (time)     params.time      = time;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;

    getEvents(params)
      .then(r => { setEvents(r.data); setTotal(r.data.length); })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [search, category, vibe, time, minPrice, maxPrice]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Push filters to URL
  function applyFilters(overrides = {}) {
    const next = {
      ...(search   ? { search }   : {}),
      ...(category ? { category } : {}),
      ...(vibe     ? { vibe }     : {}),
      ...(time     ? { time }     : {}),
      ...(minPrice ? { min_price: minPrice } : {}),
      ...(maxPrice ? { max_price: maxPrice } : {}),
      ...overrides,
    };
    // Remove empty
    Object.keys(next).forEach(k => { if (!next[k] && next[k] !== 0) delete next[k]; });
    setSearchParams(next);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    applyFilters();
  }

  function selectCategory(slug) {
    const next = slug === category ? '' : slug;
    setCategory(next);
    applyFilters({ category: next });
  }

  function selectVibe(slug) {
    const next = slug === vibe ? '' : slug;
    setVibe(next);
    applyFilters({ vibe: next });
  }

  function selectTime(val) {
    setTime(val);
    applyFilters({ time: val });
  }

  function clearAll() {
    setSearch(''); setCategory(''); setVibe('');
    setTime(''); setMinPrice(''); setMaxPrice('');
    setSearchParams({});
  }

  const hasFilters = search || category || vibe || time || minPrice || maxPrice;

  return (
    <div className="browse-page">
      {/* ── Hero ── */}
      <div className="browse-hero">
        <h1 className="browse-hero-title">Browse All Events</h1>
        <p className="browse-hero-sub">Search, filter and find your next experience in Morocco</p>

        <form className="browse-search-bar" onSubmit={handleSearchSubmit}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search events, artists, venues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="browse-body">
        {/* ── Sidebar filters ── */}
        <aside className="browse-sidebar">

          {/* Time */}
          <div className="filter-block">
            <div className="filter-block-title">Date</div>
            <div className="filter-pills">
              {TIME_TABS.map(t => (
                <button
                  key={t.value}
                  className={`filter-pill ${time === t.value ? 'active' : ''}`}
                  onClick={() => selectTime(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="filter-block">
            <div className="filter-block-title">Category</div>
            <div className="filter-pills">
              {categories.map(c => (
                <button
                  key={c.id}
                  className={`filter-pill ${category === c.slug ? 'active' : ''}`}
                  onClick={() => selectCategory(c.slug)}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Vibe */}
          <div className="filter-block">
            <div className="filter-block-title">Vibe</div>
            <div className="filter-pills">
              {vibes.map(v => (
                <button
                  key={v.id}
                  className={`filter-pill ${vibe === v.slug ? 'active' : ''}`}
                  onClick={() => selectVibe(v.slug)}
                >
                  {v.emoji} {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="filter-block">
            <div className="filter-block-title">Price (MAD)</div>
            <div className="price-range">
              <input
                type="number"
                className="price-input"
                placeholder="Min"
                min="0"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                onBlur={() => applyFilters({ min_price: minPrice })}
              />
              <span className="price-sep">—</span>
              <input
                type="number"
                className="price-input"
                placeholder="Max"
                min="0"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                onBlur={() => applyFilters({ max_price: maxPrice })}
              />
            </div>
          </div>

          {hasFilters && (
            <button className="clear-filters-btn" onClick={clearAll}>
              ✕ Clear all filters
            </button>
          )}
        </aside>

        {/* ── Results ── */}
        <main className="browse-results">
          <div className="browse-results-header">
            <span className="browse-count">
              {loading ? 'Loading...' : `${total} event${total !== 1 ? 's' : ''} found`}
            </span>

            {/* Active filter tags */}
            <div className="active-tags">
              {category && (
                <span className="active-tag">
                  {categories.find(c => c.slug === category)?.icon} {categories.find(c => c.slug === category)?.name}
                  <button onClick={() => selectCategory(category)}>✕</button>
                </span>
              )}
              {vibe && (
                <span className="active-tag">
                  {vibes.find(v => v.slug === vibe)?.emoji} {vibes.find(v => v.slug === vibe)?.name}
                  <button onClick={() => selectVibe(vibe)}>✕</button>
                </span>
              )}
              {time && (
                <span className="active-tag">
                  {TIME_TABS.find(t => t.value === time)?.label}
                  <button onClick={() => selectTime('')}>✕</button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="active-tag">
                  {minPrice || '0'} – {maxPrice || '∞'} MAD
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); applyFilters({ min_price: '', max_price: '' }); }}>✕</button>
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="browse-skeleton">
              {Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton-card" />)}
            </div>
          ) : events.length === 0 ? (
            <div className="browse-empty">
              <span>🔍</span>
              <p>No events match your filters</p>
              <button className="clear-filters-btn" onClick={clearAll}>Clear filters</button>
            </div>
          ) : (
            <div className="browse-grid">
              {events.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
