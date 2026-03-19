const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../db');
const { sendTicketEmail } = require('../utils/email');
const { v4: uuidv4 } = require('uuid');

// POST /api/payments/create-checkout
router.post('/create-checkout', async (req, res) => {
  const { eventId, quantity = 1, name, email } = req.body;
  if (!eventId || !name || !email) {
    return res.status(400).json({ error: 'eventId, name and email are required' });
  }
  try {
    const evResult = await query(
      `SELECT e.*, c.name AS category_name FROM events e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = $1`,
      [eventId]
    );
    if (evResult.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    const ev = evResult.rows[0];

    if (ev.tickets_available !== null && ev.tickets_available < quantity) {
      return res.status(400).json({
        error: ev.tickets_available === 0
          ? 'This event is sold out'
          : `Only ${ev.tickets_available} ticket(s) remaining`,
      });
    }

    const pricePerTicket = Number(ev.price);
    const totalAmount    = pricePerTicket * quantity;
    const currency       = process.env.STRIPE_CURRENCY || 'usd';
    const qrToken        = uuidv4();

    // Create pending booking
    const bookingRes = await query(
      `INSERT INTO bookings (event_id, name, email, quantity, amount_paid, qr_token, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending') RETURNING id`,
      [eventId, name, email, quantity, totalAmount, qrToken]
    );
    const bookingId = bookingRes.rows[0].id;

    // Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency,
          product_data: {
            name: ev.title,
            description: `${quantity} ticket(s) · ${ev.city}`,
          },
          unit_amount: Math.round(pricePerTicket * 100),
        },
        quantity,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL}/payment/cancel`,
      customer_email: email,
      metadata: { bookingId: String(bookingId), eventId: String(eventId), name, email, qrToken },
    });

    await query('UPDATE bookings SET stripe_session_id=$1 WHERE id=$2', [session.id, bookingId]);

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/payments/webhook  (raw body — set in index.js before express.json)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { bookingId, eventId, name, email } = session.metadata;
    try {
      await query(
        `UPDATE bookings SET status='paid', stripe_payment_id=$1 WHERE id=$2`,
        [session.payment_intent, bookingId]
      );
      const bookingForQty = await query('SELECT quantity FROM bookings WHERE id=$1', [bookingId]);
      const qty = bookingForQty.rows[0]?.quantity || 1;
      await query(
        `UPDATE events SET tickets_available = GREATEST(0, tickets_available - $1) WHERE id=$2`,
        [qty, eventId]
      );
      const [bookingRes, evRes] = await Promise.all([
        query('SELECT * FROM bookings WHERE id=$1', [bookingId]),
        query(`SELECT e.*, c.name AS category_name FROM events e LEFT JOIN categories c ON e.category_id=c.id WHERE e.id=$1`, [eventId]),
      ]);
      if (bookingRes.rows[0] && evRes.rows[0]) {
        await sendTicketEmail({ booking: bookingRes.rows[0], event: evRes.rows[0] });
      }
    } catch (err) {
      console.error('Webhook processing error:', err);
    }
  }
  res.json({ received: true });
});

// GET /api/payments/verify/:sessionId
router.get('/verify/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    console.log(`[verify] session ${req.params.sessionId} payment_status=${session.payment_status}`);

    const result = await query(
      `SELECT b.*, e.title AS event_title, e.event_date, e.city, e.venue
       FROM bookings b JOIN events e ON b.event_id = e.id
       WHERE b.stripe_session_id=$1`,
      [req.params.sessionId]
    );
    const booking = result.rows[0] || null;
    console.log(`[verify] booking found=${!!booking} status=${booking?.status}`);

    // Fallback: if webhook never fired but payment is confirmed, confirm booking & send email
    if (session.payment_status === 'paid' && booking && booking.status === 'pending') {
      console.log(`[verify] confirming booking #${booking.id} and sending ticket email to ${booking.email}`);

      await query(
        `UPDATE bookings SET status='paid', stripe_payment_id=$1 WHERE id=$2`,
        [session.payment_intent, booking.id]
      );
      await query(
        `UPDATE events SET tickets_available = GREATEST(0, tickets_available - $1) WHERE id=$2`,
        [booking.quantity, booking.event_id]
      );

      const [freshBooking, evRes] = await Promise.all([
        query('SELECT * FROM bookings WHERE id=$1', [booking.id]),
        query(
          `SELECT e.*, c.name AS category_name FROM events e LEFT JOIN categories c ON e.category_id=c.id WHERE e.id=$1`,
          [booking.event_id]
        ),
      ]);

      if (freshBooking.rows[0] && evRes.rows[0]) {
        try {
          await sendTicketEmail({ booking: freshBooking.rows[0], event: evRes.rows[0] });
          console.log(`[verify] ticket email sent successfully to ${booking.email}`);
        } catch (emailErr) {
          console.error(`[verify] EMAIL FAILED:`, emailErr.message);
        }
      }
      booking.status = 'paid';
    }

    res.json({ status: session.payment_status, booking });
  } catch (err) {
    console.error('[verify] error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
