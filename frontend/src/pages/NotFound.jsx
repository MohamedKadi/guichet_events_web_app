import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="nf-page">
      <div className="nf-inner">
        <div className="nf-code">404</div>
        <h1 className="nf-title">Page not found</h1>
        <p className="nf-sub">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="nf-btn">← Back to Home</Link>
      </div>
    </div>
  );
}
