import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getEvents = (params) => api.get('/events', { params });
export const getFeaturedEvents = () => api.get('/events/featured');
export const getTrendingEvents = () => api.get('/events/trending');
export const getRecommendedEvents = () => api.get('/events/recommended');
export const getEvent = (id) => api.get(`/events/${id}`);

export const getCategories = () => api.get('/categories');
export const getVibes = () => api.get('/vibes');

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);

export const getMe = () => api.get('/users/me');

export const subscribeNewsletter = (email) => api.post('/newsletter', { email });

export const createCheckout = (data) => api.post('/payments/create-checkout', data);
export const verifyPayment  = (sessionId) => api.get(`/payments/verify/${sessionId}`);

export default api;
