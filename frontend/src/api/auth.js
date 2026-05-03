import axios from 'axios';

// Створення екземпляру axios з базовим URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

// Додавання токена до кожного запиту, якщо він є
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Об'єкт для роботи з авторизацією через API
export const authApi = {
  // Вхід до системи (повертає { user, tokens })
  login: (data) => api.post('accounts/login/', data),
  
  // Реєстрація нового користувача
  register: (data) => api.post('accounts/register/', data),
  
  // Отримання профілю поточного користувача
  getProfile: () => api.get('accounts/me/'),
  
  // Вихід із системи
  logout: (data) => api.post('accounts/logout/', data),
};
