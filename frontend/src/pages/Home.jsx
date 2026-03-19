import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import EventCard from "../components/EventCard";
import {
  getFeaturedEvents,
  getEvents,
  getTrendingEvents,
  getRecommendedEvents,
  getVibes,
  subscribeNewsletter,
} from "../services/api";
import "./Home.css";

const CATEGORIES = [
  { name: "Concerts", slug: "concerts", icon: "🎵" },
  { name: "Festivals", slug: "festivals", icon: "🎪" },
  { name: "Theatre", slug: "theatre-humour", icon: "🎭" },
  { name: "Cinema", slug: "cinema", icon: "🎬" },
  { name: "Sports", slug: "sport", icon: "⚽" },
  { name: "Entertainment", slug: "divertissement", icon: "🎠" },
  { name: "Kids", slug: "jeune-public", icon: "👶" },
  { name: "Exhibitions", slug: "salon-formation", icon: "🎓" },
];

const CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Fès",
  "Tanger",
  "Agadir",
  "Essaouira",
];

const TIME_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "Weekend", value: "weekend" },
  { label: "This month", value: "month" },
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [featured, setFeatured] = useState([]);
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [loading, setLoading] = useState(false);

  const catsRef = useRef(null);
  const trendRef = useRef(null);

  const [heroQ, setHeroQ] = useState("");
  const [heroCity, setHeroCity] = useState("");
  const [heroTime, setHeroTime] = useState("");
  const [nlEmail, setNlEmail] = useState("");
  const [nlDone, setNlDone] = useState(false);

  const searchQuery = searchParams.get("search") || "";
  const cityQuery = searchParams.get("city") || "";
  const timeQuery = searchParams.get("time") || "";
  const isSearching = searchQuery || cityQuery;

  // Fetch static sections once on mount
  useEffect(() => {
    getFeaturedEvents()
      .then((r) => setFeatured(r.data))
      .catch(() => {});
    getTrendingEvents()
      .then((r) => setTrending(r.data))
      .catch(() => {});
    getRecommendedEvents()
      .then((r) => setRecommended(r.data))
      .catch(() => {});
    getVibes()
      .then((r) => setVibes(r.data))
      .catch(() => {});
  }, []);

  // Fetch events only when user is searching
  useEffect(() => {
    if (!isSearching) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getEvents({
      search: searchQuery || undefined,
      city: cityQuery || undefined,
      time: timeQuery || undefined,
    })
      .then((r) => setEvents(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchQuery, cityQuery, timeQuery, isSearching]);

  function handleHeroSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (heroQ.trim()) params.set("search", heroQ.trim());
    if (heroCity) params.set("city", heroCity);
    if (heroTime) params.set("time", heroTime);
    navigate(`/?${params.toString()}`);
  }

  async function handleNL(e) {
    e.preventDefault();
    if (!nlEmail.trim()) return;
    try {
      await subscribeNewsletter(nlEmail.trim());
    } catch {
      /* silent */
    }
    setNlDone(true);
  }

  return (
    <main className="home-page">
      {/* ═══ HERO ═══ */}
      {!isSearching && (
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-orb" />
          <div className="hero-inner wrap">
            {/* Left */}
            <div className="hero-left">
              <div className="hero-eyebrow">
                ⭐ #1 Event Ticketing in Morocco
              </div>
              <h1>
                Find events in
                <br />
                <span className="hl">Morocco</span>
              </h1>
              <p className="hero-sub">
                Concerts, sports, festivals, theatre — thousands of events at
                your fingertips.
              </p>

              <form className="hero-search" onSubmit={handleHeroSearch}>
                <div className="hs-field">
                  <span className="hsi">🔍</span>
                  <input
                    type="text"
                    placeholder="Event, artist, venue..."
                    value={heroQ}
                    onChange={(e) => setHeroQ(e.target.value)}
                  />
                </div>
                <div className="hs-field">
                  <span className="hsi">📍</span>
                  <select
                    value={heroCity}
                    onChange={(e) => setHeroCity(e.target.value)}
                  >
                    <option value="">All cities</option>
                    {CITIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="hs-field">
                  <span className="hsi">📅</span>
                  <select
                    value={heroTime}
                    onChange={(e) => setHeroTime(e.target.value)}
                  >
                    <option value="">Any time</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-search">
                  Search →
                </button>
              </form>

              <div className="hero-stats">
                <div>
                  <div className="hstat-num">1,200+</div>
                  <div className="hstat-label">Events</div>
                </div>
                <div>
                  <div className="hstat-num">40+</div>
                  <div className="hstat-label">Cities</div>
                </div>
                <div>
                  <div className="hstat-num">85K+</div>
                  <div className="hstat-label">Tickets Sold</div>
                </div>
                <div>
                  <div className="hstat-num">4.9★</div>
                  <div className="hstat-label">Rating</div>
                </div>
              </div>
            </div>

            {/* Right — preview cards */}
            {featured.length > 0 && (
              <div className="hero-right">
                {featured.slice(0, 3).map((ev) => (
                  <Link to={`/events/${ev.id}`} className="hcp" key={ev.id}>
                    <div className="hcp-icon">{ev.category_icon || "🎭"}</div>
                    <div className="hcp-info">
                      <div className="hcp-title">{ev.title}</div>
                      <div className="hcp-meta">
                        {ev.city} · {formatDate(ev.event_date)}
                      </div>
                    </div>
                    <div className="hcp-price">
                      {Number(ev.price) > 0
                        ? `${Number(ev.price).toFixed(0)}`
                        : "Free"}
                    </div>
                    {ev.is_featured && <span className="hcp-badge">HOT</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ SEARCH RESULTS ═══ */}
      {isSearching && (
        <div className="wrap">
          <div className="sec">
            <div className="sec-head">
              <div>
                <div className="sec-label">Results</div>
                <h2 className="sec-title">
                  Results for "<span>{searchQuery || cityQuery}</span>"
                </h2>
              </div>
            </div>
            {loading ? (
              <div className="skeleton-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton-card" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <span>🎭</span>
                <p>No events found</p>
                <small>Try different filters or check back later</small>
              </div>
            ) : (
              <div className="cards-grid">
                {events.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!isSearching && (
        <>
          {/* ═══ CATEGORIES ═══ */}
          <div className="wrap">
            <div className="sec">
              <div className="sec-head">
                <div>
                  <div className="sec-label">Categories</div>
                  <h2 className="sec-title">
                    Browse by <span>type</span>
                  </h2>
                </div>
              </div>
              <div className="cats-wrap">
                <button
                  className="cats-arrow cats-arrow-l"
                  onClick={() =>
                    catsRef.current?.scrollBy({
                      left: -280,
                      behavior: "smooth",
                    })
                  }
                >
                  ‹
                </button>
                <div className="cats-scroll" ref={catsRef}>
                  {CATEGORIES.map((cat) => (
                    <Link
                      to={`/category/${cat.slug}`}
                      className="cat-card"
                      key={cat.slug}
                    >
                      <div className="cc-icon">{cat.icon}</div>
                      <div className="cc-label">{cat.name}</div>
                    </Link>
                  ))}
                </div>
                <button
                  className="cats-arrow cats-arrow-r"
                  onClick={() =>
                    catsRef.current?.scrollBy({ left: 280, behavior: "smooth" })
                  }
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* ═══ FEATURED BANNER ═══ */}
          {featured[0] && (
            <div className="wrap">
              <div className="sec" style={{ paddingBottom: 0 }}>
                <Link to={`/events/${featured[0].id}`} className="feat-banner">
                  <div className="feat-glow" />
                  <div className="feat-deco">
                    {featured[0].category_icon || "🎶"}
                  </div>
                  <div className="feat-overlay" />
                  <div className="feat-body">
                    <div className="feat-tag">⚡ Featured</div>
                    <div className="feat-title">{featured[0].title}</div>
                    <div className="feat-sub">
                      {featured[0].city}
                      {featured[0].venue
                        ? ` · ${featured[0].venue.split(",")[0]}`
                        : ""}
                      {" · "}
                      {formatDate(featured[0].event_date)}
                    </div>
                    <button className="btn-feat">Get my ticket →</button>
                  </div>
                </Link>
              </div>
            </div>
          )}

          <div className="divider" style={{ marginTop: 64 }} />

          {/* ═══ FEATURED EVENTS GRID ═══ */}
          <div className="wrap">
            <div className="sec">
              <div className="sec-head">
                <div>
                  <div className="sec-label">Featured</div>
                  <h2 className="sec-title">
                    Events you <span>can't miss</span>
                  </h2>
                </div>
              </div>
              <div className="cards-grid">
                {featured.slice(0, 6).map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* ═══ TRENDING ═══ */}
          {trending.length > 0 && (
            <div className="wrap">
              <div className="sec">
                <div className="sec-head">
                  <div>
                    <div className="sec-label">Trending</div>
                    <h2 className="sec-title">
                      This <span>week 🔥</span>
                    </h2>
                  </div>
                </div>
                <div className="trending-wrap">
                  <button
                    className="cats-arrow"
                    onClick={() =>
                      trendRef.current?.scrollBy({
                        left: -260,
                        behavior: "smooth",
                      })
                    }
                  >
                    ‹
                  </button>
                  <div className="trending-scroll" ref={trendRef}>
                    {trending.map((ev, idx) => (
                      <Link
                        to={`/events/${ev.id}`}
                        className="trend-card"
                        key={ev.id}
                      >
                        <div
                          className="trend-card-img"
                          style={
                            ev.image_url
                              ? {}
                              : {
                                  background: `hsl(${(ev.id * 47) % 360},40%,18%)`,
                                }
                          }
                        >
                          {ev.image_url ? (
                            <img
                              src={ev.image_url}
                              alt={ev.title}
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          ) : (
                            <span style={{ fontSize: 40 }}>
                              {ev.category_icon || "🎭"}
                            </span>
                          )}
                          <span className="trend-rank">#{idx + 1}</span>
                        </div>
                        <div className="trend-card-body">
                          <div className="trend-card-title">{ev.title}</div>
                          <div className="trend-card-meta">
                            {ev.city} · {formatDate(ev.event_date)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <button
                    className="cats-arrow"
                    onClick={() =>
                      trendRef.current?.scrollBy({
                        left: 260,
                        behavior: "smooth",
                      })
                    }
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="divider" />

          {/* ═══ MOOD ═══ */}
          <div className="wrap">
            <div className="sec">
              <div className="sec-head">
                <div>
                  <div className="sec-label">Mood</div>
                  <h2 className="sec-title">
                    Find events by <span>vibe</span>
                  </h2>
                </div>
              </div>
              <div className="mood-grid">
                {vibes.map((v) => (
                  <Link
                    to={`/vibe/${v.slug}`}
                    className="mood-card"
                    key={v.slug}
                  >
                    <div className="mc-emoji">{v.emoji}</div>
                    <div className="mc-label">{v.name}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* ═══ RECOMMENDED ═══ */}
          {recommended.length > 0 && (
            <div className="wrap">
              <div className="sec">
                <div className="sec-head">
                  <div>
                    <div className="sec-label">Recommended</div>
                    <h2 className="sec-title">
                      Picked <span>for you</span>
                    </h2>
                  </div>
                </div>
                <div className="cards-grid">
                  {recommended.map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ NEWSLETTER ═══ */}
          <div className="newsletter-sec">
            <div className="nl-inner">
              <div className="sec-label" style={{ marginBottom: 10 }}>
                Newsletter
              </div>
              <h2 className="nl-title">Stay updated on events</h2>
              <p className="nl-sub">
                Get the best offers and upcoming events delivered straight to
                your inbox.
              </p>
              {nlDone ? (
                <div className="nl-confirm">✅ You're subscribed! Thanks.</div>
              ) : (
                <form className="nl-form" onSubmit={handleNL}>
                  <input
                    className="nl-input"
                    type="email"
                    placeholder="your@email.com"
                    value={nlEmail}
                    onChange={(e) => setNlEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-nl">
                    Subscribe →
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ═══ FOOTER ═══ */}
          <footer className="footer">
            <div className="footer-grid wrap">
              <div className="fg-brand">
                <div className="footer-logo">EvenTick</div>
                <p>
                  Morocco's leading event ticketing platform. Concerts, sports,
                  expos and more.
                </p>
                <div className="foot-social">
                  <a href="#" aria-label="Facebook">
                    f
                  </a>
                  <a href="#" aria-label="Instagram">
                    📷
                  </a>
                  <a href="#" aria-label="X">
                    𝕏
                  </a>
                  <a href="#" aria-label="YouTube">
                    ▶️
                  </a>
                </div>
              </div>
              <div className="fg-col">
                <h4>About</h4>
                <a href="#">Our Mission</a>
                <a href="#">Team</a>
                <a href="#">Press</a>
                <a href="#">Careers</a>
              </div>
              <div className="fg-col">
                <h4>Support</h4>
                <a href="#">FAQ</a>
                <a href="#">Contact</a>
                <a href="#">Refunds</a>
                <a href="#">Report an issue</a>
              </div>
              <div className="fg-col">
                <h4>Organizers</h4>
                <a href="#">Create an event</a>
                <a href="#">Pricing</a>
                <a href="#">API Docs</a>
                <a href="#">Partnerships</a>
              </div>
            </div>
            <div className="foot-bottom wrap">
              <p>© 2026 EvenTick · All rights reserved</p>
              <p>Terms · Privacy · Cookies</p>
            </div>
          </footer>
        </>
      )}
    </main>
  );
}
