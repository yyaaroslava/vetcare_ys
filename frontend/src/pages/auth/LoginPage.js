import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      window.location.href = '/';
    } catch (err) {
      setError('Невірна пошта або пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-text">VetCare</div>
        </div>

        <div className="auth-title">Вхід до системи</div>
        <div className="auth-subtitle">Введіть ваші дані для доступу</div>

        {error && <div className="auth-error">✕ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Електронна пошта</label>
            <input 
              className="form-input"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="email@example.com"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input 
              className="form-input"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Вхід...' : 'Увійти →'}
          </button>
        </form>

        <div className="auth-link">
          Немає акаунту? <Link to="/register">Зареєструватися</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
