const router = require('express').Router();
const { query } = require('../db');
const { optionalAuth } = require('../middleware/authMiddleware');

// GET /api/events?category=&city=&search=&time=&vibe=&min_price=&max_price=
router.get('/', optionalAuth, async (req, res) => {
  const { category, city, search, time, vibe, min_price, max_price } = req.query;
  let conditions = [];
  let params = [];
  let idx = 1;

  if (category) {
    conditions.push(`c.slug = $${idx++}`);
    params.push(category);
  }
  if (city) {
    conditions.push(`LOWER(e.city) = LOWER($${idx++})`);
    params.push(city);
  }
  if (search) {
    conditions.push(`(LOWER(e.title) LIKE LOWER($${idx++}) OR LOWER(e.description) LIKE LOWER($${idx++}))`);
    params.push(`%${search}%`, `%${search}%`);
    idx++;
  }
  if (time === 'today') {
    conditions.push(`e.event_date::date = CURRENT_DATE`);
  } else if (time === 'week') {
    conditions.push(`e.event_date >= NOW() AND e.event_date < NOW() + INTERVAL '7 days'`);
  } else if (time === 'weekend') {
    conditions.push(`EXTRACT(DOW FROM e.event_date) IN (0, 6) AND e.event_date >= NOW()`);
  } else if (time === 'month') {
    conditions.push(`EXTRACT(MONTH FROM e.event_date) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM e.event_date) = EXTRACT(YEAR FROM NOW())`);
  }
  if (vibe) {
    conditions.push(`v.slug = $${idx++}`);
    params.push(vibe);
  }
  if (min_price !== undefined && min_price !== '') {
    conditions.push(`e.price >= $${idx++}`);
    params.push(parseFloat(min_price));
  }
  if (max_price !== undefined && max_price !== '') {
    conditions.push(`e.price <= $${idx++}`);
    params.push(parseFloat(max_price));
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await query(
      `SELECT e.*, c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
              v.name AS vibe_name, v.slug AS vibe_slug, v.emoji AS vibe_emoji
       FROM events e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN vibes v ON e.vibe_id = v.id
       ${where}
       ORDER BY e.event_date ASC
       LIMIT 50`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/events/featured
router.get('/featured', async (req, res) => {
  try {
    const result = await query(
      `SELECT e.*, c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
              v.name AS vibe_name, v.slug AS vibe_slug, v.emoji AS vibe_emoji
       FROM events e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN vibes v ON e.vibe_id = v.id
       WHERE e.is_featured = TRUE
       ORDER BY e.event_date ASC
       LIMIT 6`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/events/trending
router.get('/trending', async (req, res) => {
  try {
    const result = await query(
      `SELECT e.*, c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
              v.name AS vibe_name, v.slug AS vibe_slug, v.emoji AS vibe_emoji
       FROM events e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN vibes v ON e.vibe_id = v.id
       WHERE e.is_trending = TRUE
       ORDER BY e.click_count DESC
       LIMIT 8`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/events/recommended  (by user preferences/clicks or popular events if not logged in)
router.get('/recommended', optionalAuth, async (req, res) => {
  try {
    let result;
    if (req.user) {
      result = await query(
        `SELECT DISTINCT e.*, c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
                v.name AS vibe_name, v.slug AS vibe_slug, v.emoji AS vibe_emoji
         FROM events e
         LEFT JOIN categories c ON e.category_id = c.id
         LEFT JOIN vibes v ON e.vibe_id = v.id
         WHERE e.category_id IN (
           SELECT DISTINCT e2.category_id FROM user_clicks uc
           JOIN events e2 ON uc.event_id = e2.id
           WHERE uc.user_id = $1
         )
         AND e.id NOT IN (
           SELECT event_id FROM user_clicks WHERE user_id = $1
         )
         ORDER BY e.click_count DESC
         LIMIT 8`,
        [req.user.id]
      );
      if (result.rows.length < 4) {
        result = await query(
          `SELECT e.*, c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
                  v.name AS vibe_name, v.slug AS vibe_slug, v.emoji AS vibe_emoji
           FROM events e
           LEFT JOIN categories c ON e.category_id = c.id
           LEFT JOIN vibes v ON e.vibe_id = v.id
           ORDER BY e.click_count DESC LIMIT 8`
        );
      }
    } else {
      result = await query(
        `SELECT e.*, c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
                v.name AS vibe_name, v.slug AS vibe_slug, v.emoji AS vibe_emoji
         FROM events e
         LEFT JOIN categories c ON e.category_id = c.id
         LEFT JOIN vibes v ON e.vibe_id = v.id
         ORDER BY e.click_count DESC LIMIT 8`
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/events/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT e.*, c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
              v.name AS vibe_name, v.slug AS vibe_slug, v.emoji AS vibe_emoji
       FROM events e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN vibes v ON e.vibe_id = v.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Track click
    await query('UPDATE events SET click_count = click_count + 1 WHERE id = $1', [req.params.id]);
    if (req.user) {
      await query(
        'INSERT INTO user_clicks (user_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.user.id, req.params.id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
