require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { pool } = require('./db');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const categoryRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');
const vibeRoutes       = require('./routes/vibes');
const newsletterRoutes = require('./routes/newsletter');
const paymentRoutes    = require('./routes/payments');
const adminRoutes      = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan('dev'));
app.use(cors({
  origin: ['http://localhost:3000', 'http://frontend:3000'],
  credentials: true,
}));

// Raw body needed for Stripe webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vibes',      vibeRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api/admin',      adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        city VARCHAR(100),
        preferences TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        icon VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS vibes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        emoji VARCHAR(20)
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES categories(id),
        city VARCHAR(100),
        venue VARCHAR(255),
        event_date TIMESTAMP,
        price DECIMAL(10,2) DEFAULT 0,
        image_url VARCHAR(500),
        organizer VARCHAR(255),
        is_featured BOOLEAN DEFAULT FALSE,
        is_trending BOOLEAN DEFAULT FALSE,
        tickets_available INTEGER DEFAULT 100,
        click_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_clicks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        clicked_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE events ADD COLUMN IF NOT EXISTS vibe_id INTEGER REFERENCES vibes(id);

      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        quantity INTEGER DEFAULT 1,
        amount_paid DECIMAL(10,2) DEFAULT 0,
        stripe_session_id VARCHAR(255) UNIQUE,
        stripe_payment_id VARCHAR(255),
        qr_token VARCHAR(255) UNIQUE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Remove duplicate events keeping only the lowest id per title
      DELETE FROM user_clicks WHERE event_id IN (
        SELECT id FROM events WHERE id NOT IN (
          SELECT MIN(id) FROM events GROUP BY title
        )
      );
      DELETE FROM events WHERE id NOT IN (
        SELECT MIN(id) FROM events GROUP BY title
      );

      -- Ensure no future duplicates
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'events_title_unique'
        ) THEN
          ALTER TABLE events ADD CONSTRAINT events_title_unique UNIQUE (title);
        END IF;
      END $$;
    `);
    console.log('Database tables initialized');
  } finally {
    client.release();
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await initDB();
    if (process.env.SEED_DB !== 'false') {
      const seed = require('./seed');
      await seed();
    } else {
      console.log('Seeding skipped (SEED_DB=false)');
    }
  } catch (err) {
    console.error('DB init error:', err.message);
  }
});
