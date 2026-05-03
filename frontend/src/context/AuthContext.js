import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

// Контекст для керування станом авторизації у всьому додатку
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Завантаження даних користувача при першому рендері
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  // Перевірка токена та отримання профілю
  const checkAuth = async () => {
    try {
      const response = await authApi.getProfile();
      setUser(response.data);
    } catch (err) {
      logout(); // Очищення даних при невалідному токені
    } finally {
      setLoading(false);
    }
  };

  // Метод для входу в систему
  const login = async (credentials) => {
    const response = await authApi.login({
      email: credentials.email.trim(),
      password: credentials.password.trim()
    });
    
    // Збереження токенів до локального сховища
    localStorage.setItem('access_token', response.data.tokens.access);
    localStorage.setItem('refresh_token', response.data.tokens.refresh);
    
    // Оновлення стану користувача
    setUser(response.data.user);
  };

  // Метод для виходу з системи
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
