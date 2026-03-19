const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const adminMiddleware = require('../middleware/adminMiddleware');

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const { password_hash, ...safeAdmin } = admin;
    res.json({ admin: safeAdmin, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/me
router.get('/me', adminMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, created_at FROM admins WHERE id = $1',
      [req.admin.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Admin not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/events — create a new event
router.post('/events', adminMiddleware, async (req, res) => {
  const {
    title, description, category_id, vibe_id,
    city, venue, event_date, price,
    image_url, organizer, is_featured, is_trending, tickets_available
  } = req.body;

  const missing = [];
  if (!title)              missing.push('title');
  if (!description)        missing.push('description');
  if (!category_id)        missing.push('category');
  if (!vibe_id)            missing.push('vibe');
  if (!city)               missing.push('city');
  if (!venue)              missing.push('venue');
  if (!event_date)         missing.push('event date');
  if (price === undefined || price === null || price === '') missing.push('price');
  if (!image_url)          missing.push('image URL');
  if (!organizer)          missing.push('organizer');
  if (!tickets_available)  missing.push('tickets available');

  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  try {
    const result = await query(
      `INSERT INTO events
        (title, description, category_id, vibe_id, city, venue, event_date,
         price, image_url, organizer, is_featured, is_trending, tickets_available)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        title,
        description,
        category_id,
        vibe_id,
        city,
        venue,
        event_date,
        parseFloat(price),
        image_url,
        organizer,
        is_featured || false,
        is_trending || false,
        parseInt(tickets_available)
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An event with this title already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/verify-ticket/:token — verify a booking QR token
router.get('/verify-ticket/:token', adminMiddleware, async (req, res) => {
  const { token } = req.params;
  try {
    const result = await query(
      `SELECT b.*, e.title AS event_title, e.event_date, e.venue
       FROM bookings b
       JOIN events e ON e.id = b.event_id
       WHERE b.qr_token = $1`,
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Ticket not found' });
    }
    const booking = result.rows[0];
    if (booking.status === 'confirmed') {
      return res.json({ valid: false, error: 'Ticket already scanned', booking });
    }
    if (booking.status !== 'paid') {
      return res.json({ valid: false, error: `Ticket status: ${booking.status}`, booking });
    }

    // First scan: mark as confirmed (attended)
    await query('UPDATE bookings SET status = $1 WHERE qr_token = $2', ['confirmed', token]);
    booking.status = 'confirmed';

    res.json({ valid: true, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/categories — list categories (for add-event form)
router.get('/categories', adminMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/vibes — list vibes (for add-event form)
router.get('/vibes', adminMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM vibes ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
