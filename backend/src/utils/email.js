const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

async function sendTicketEmail({ booking, event }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const qrData = JSON.stringify({
    bookingId: booking.id,
    eventId:   booking.event_id,
    name:      booking.name,
    email:     booking.email,
    qty:       booking.quantity,
    token:     booking.qr_token,
  });

  const qrBuffer = await QRCode.toBuffer(qrData, {
    width: 280, margin: 2,
    color: { dark: '#07090F', light: '#FFFFFF' },
  });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f0f4fa;padding:40px 16px}
    .wrap{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.12)}
    .hdr{background:linear-gradient(135deg,#1BCDE0,#1645C8);padding:36px 32px;text-align:center}
    .hdr h1{color:#fff;font-size:26px;font-weight:900;letter-spacing:-.02em;margin-bottom:4px}
    .hdr p{color:rgba(255,255,255,.8);font-size:14px}
    .body{padding:32px}
    .hi{font-size:16px;color:#1a1a2e;margin-bottom:22px}
    .ecard{background:#f8faff;border:1px solid #dde8ff;border-radius:12px;padding:18px;margin-bottom:24px}
    .etitle{font-size:18px;font-weight:800;color:#1a1a2e;margin-bottom:8px}
    .emeta{font-size:13px;color:#666;margin-bottom:4px}
    .qr-wrap{text-align:center;padding:24px 0;border-top:2px dashed #dde8ff;border-bottom:2px dashed #dde8ff;margin:20px 0}
    .qr-wrap img{width:200px;height:200px;border-radius:8px;border:6px solid #fff;box-shadow:0 4px 20px rgba(0,0,0,.12)}
    .qr-label{font-size:12px;color:#999;margin-top:10px}
    .tinfo{background:#07090F;border-radius:12px;padding:20px;margin:20px 0}
    .trow{display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px}
    .trow:last-child{margin-bottom:0}
    .tlabel{color:rgba(255,255,255,.55)}
    .tval{font-weight:700;color:#1BCDE0}
    .footer{background:#f8faff;padding:20px 32px;text-align:center;font-size:12px;color:#aaa}
    .footer a{color:#1BCDE0;text-decoration:none}
  </style></head><body>
  <div class="wrap">
    <div class="hdr">
      <h1>EvenTick 🎟️</h1>
      <p>Your ticket is confirmed!</p>
    </div>
    <div class="body">
      <p class="hi">Hi <strong>${booking.name}</strong>, your booking is confirmed! 🎉</p>
      <div class="ecard">
        <div class="etitle">${event.title}</div>
        <div class="emeta">📅 ${formatDate(event.event_date)} · ${formatTime(event.event_date)}</div>
        <div class="emeta">📍 ${event.city}${event.venue ? ' · ' + event.venue : ''}</div>
      </div>
      <div class="qr-wrap">
        <img src="cid:ticket-qr" alt="QR ticket" />
        <div class="qr-label">Present this QR code at the entrance</div>
      </div>
      <div class="tinfo">
        <div class="trow"><span class="tlabel">Booking ID</span><span class="tval">#${String(booking.id).padStart(6,'0')}</span></div>
        <div class="trow"><span class="tlabel">Name</span><span class="tval">${booking.name}</span></div>
        <div class="trow"><span class="tlabel">Email</span><span class="tval">${booking.email}</span></div>
        <div class="trow"><span class="tlabel">Tickets</span><span class="tval">${booking.quantity}</span></div>
        <div class="trow"><span class="tlabel">Total paid</span><span class="tval">${Number(booking.amount_paid).toFixed(0)} ${process.env.STRIPE_CURRENCY?.toUpperCase() || 'USD'}</span></div>
      </div>
    </div>
    <div class="footer">
      <p>© 2026 EvenTick · Morocco's #1 Event Ticketing Platform</p>
      <p style="margin-top:6px">Questions? <a href="mailto:${process.env.SMTP_USER}">support@guichet.ma</a></p>
    </div>
  </div>
  </body></html>`;

  await transporter.sendMail({
    from: `"EvenTick" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: booking.email,
    subject: `🎟️ Your ticket for ${event.title} – Booking #${String(booking.id).padStart(6,'0')}`,
    html,
    attachments: [{
      filename: 'ticket-qr.png',
      content: qrBuffer,
      cid: 'ticket-qr',
    }],
  });
}

module.exports = { sendTicketEmail };
