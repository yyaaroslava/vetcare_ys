import axios from 'axios';

/**
 * Конфігурація HTTP-клієнта Axios.
 * Автоматично додає JWT-токен до запитів та оновлює його при закінченні терміну дії.
 */
// REACT_APP_API_URL на Render має закінчуватися на /api (напр. https://vetcare-ys.onrender.com/api)
const normalizeApiBase = (url) => {
  const base = (url || 'http://localhost:8000').replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
};

const API_BASE = normalizeApiBase(process.env.REACT_APP_API_URL);

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/accounts/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
