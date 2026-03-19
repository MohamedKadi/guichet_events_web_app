import { Link } from 'react-router-dom';
import './PaymentSuccess.css';

export default function PaymentCancel() {
  return (
    <main className="ps-page">
      <div className="ps-card">
        <div className="ps-icon">😕</div>
        <h1 className="ps-title">Payment Cancelled</h1>
        <p className="ps-sub">
          No worries — your payment was not processed.<br />
          You can go back and try again whenever you're ready.
        </p>
        <Link to="/" className="ps-btn">Back to events →</Link>
      </div>
    </main>
  );
}
