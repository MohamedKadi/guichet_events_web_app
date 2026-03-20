import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import VibePage from './pages/VibePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Favorites from './pages/Favorites';
import EventDetail from './pages/EventDetail';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel  from './pages/PaymentCancel';
import BrowsePage from './pages/BrowsePage';
import NotFound from './pages/NotFound';
import StarCanvas from './components/StarCanvas';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import { useAdminAuth } from './context/AdminAuthContext';

function AdminRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return null;
  return admin ? children : <Navigate to="/admin/login" replace />;
}

function AdminLoginRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return null;
  return admin ? <Navigate to="/admin/dashboard" replace /> : children;
}

export default function App() {
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = saved;
  }, []);

  return (
    <>
      <StarCanvas />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          {/* Admin routes — no Header */}
          <Route path="/admin/login" element={
            <AdminLoginRoute><AdminLogin /></AdminLoginRoute>
          } />
          <Route path="/admin/dashboard" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />

          {/* Public routes — with Header */}
          <Route path="/*" element={
            <>
              <Header />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/vibe/:slug" element={<VibePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/events" element={<BrowsePage />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/cancel"  element={<PaymentCancel />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </>
          } />
        </Routes>
      </div>
    </>
  );
}
