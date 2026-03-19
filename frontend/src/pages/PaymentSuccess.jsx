import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyPayment } from '../services/api';
import './PaymentSuccess.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    verifyPayment(sessionId)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <div className="ps-page">
      <div className="ps-spinner" />
    </div>
  );

  return (
    <main className="ps-page">
      <div className="ps-card">
        <div className="ps-icon">🎉</div>
        <h1 className="ps-title">Booking Confirmed!</h1>
        <p className="ps-sub">
          Your ticket has been booked successfully.<br />
          <strong>Check your email</strong> — your QR code ticket is on its way.
        </p>

        {data?.booking && (
          <div className="ps-details">
            <div className="ps-row">
              <span>Event</span>
              <span>{data.booking.event_title}</span>
            </div>
            <div className="ps-row">
              <span>Date</span>
              <span>{formatDate(data.booking.event_date)}</span>
            </div>
            <div className="ps-row">
              <span>Name</span>
              <span>{data.booking.name}</span>
            </div>
            <div className="ps-row">
              <span>Email</span>
              <span>{data.booking.email}</span>
            </div>
            <div className="ps-row">
              <span>Tickets</span>
              <span>{data.booking.quantity}</span>
            </div>
            <div className="ps-row">
              <span>Booking ID</span>
              <span className="ps-booking-id">#{String(data.booking.id).padStart(6, '0')}</span>
            </div>
          </div>
        )}

        <Link to="/" className="ps-btn">Browse more events →</Link>
      </div>
    </main>
  );
}
