import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://mt5-scanner-production.up.railway.app';

const api = axios.create({ baseURL: API_URL });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (email: string, password: string) =>
  api.post('/api/v1/auth/login', { email, password });

export const register = (email: string, password: string, name: string) =>
  api.post('/api/v1/auth/register', { email, password, name });

// Signals
export const getSignals = (status = 'PENDING') =>
  api.get(`/api/v1/signals?status=${status}`);

export const toggleSignal = (id: string) =>
  api.put(`/api/v1/signals/${id}/toggle`);

export const cancelSignal = (id: string) =>
  api.put(`/api/v1/signals/${id}/cancel`);

// Trades
export const getTrades = (params?: any) =>
  api.get('/api/v1/trades', { params });

export const getPerformance = () =>
  api.get('/api/v1/trades/performance');

// Account
export const getAccounts = () =>
  api.get('/api/v1/account');

// Bias
export const getBias = (scanner?: string) =>
  api.get('/api/v1/bias', { params: scanner ? { scanner } : {} });

// Config
export const getConfig = () =>
  api.get('/api/v1/config');

export const updateConfig = (data: any) =>
  api.put('/api/v1/config', data);

export default api;
