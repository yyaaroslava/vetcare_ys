import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';

/**
 * Сторінка реєстрації нового користувача (клієнта).
 * Включає валідацію імені, прізвища, телефону та пароля.
 */
const RegisterPage = () => {
  const [form, setForm] = useState({ 
    email: '', 
    first_name: '', 
    last_name: '', 
    phone: '+380', 
    password: '', 
    password2: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhone = (v) => {
    if (!v.startsWith('+380')) { set('phone', '+380'); return; }
    const rest = v.slice(4).replace(/\D/g, '');
    set('phone', '+380' + rest);
  };

  const phoneDigits = form.phone.slice(4).length;
  const isPhoneValid = phoneDigits === 9;
  
  const isNameInvalid = (val) => {
    if (!val) return false;
    return val.length < 2 || /\d/.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (form.password !== form.password2) { 
      setError('Паролі не співпадають'); 
      return; 
    }

    setLoading(true);
    try {
      await authApi.register(form);
      navigate('/login');
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.values(d).flat().join(' ') : 'Помилка реєстрації');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card" style={{ width: 440 }}>
        <div className="auth-logo">
          <div className="auth-logo-text">VetCare</div>
        </div>
        
        <div className="auth-title">Реєстрація</div>
        <div className="auth-subtitle">Створіть обліковий запис власника тварини</div>
        
        {error && <div className="auth-error">✕ {error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ім'я *</label>
              <input 
                className="form-input" 
                value={form.first_name} 
                onChange={e => set('first_name', e.target.value)} 
                placeholder="Іван" 
                style={{ borderColor: isNameInvalid(form.first_name) ? 'var(--red)' : undefined }}
                required 
              />
              {isNameInvalid(form.first_name) && <div className="form-error">Невірний формат</div>}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Прізвище *</label>
              <input 
                className="form-input" 
                value={form.last_name} 
                onChange={e => set('last_name', e.target.value)} 
                placeholder="Петренко" 
                style={{ borderColor: isNameInvalid(form.last_name) ? 'var(--red)' : undefined }}
                required 
              />
              {isNameInvalid(form.last_name) && <div className="form-error">Невірний формат</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" required />
          </div>

          <div className="form-group">
            <label className="form-label">Телефон</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="form-input" 
                type="tel" 
                value={form.phone} 
                onChange={e => handlePhone(e.target.value)}
                placeholder="+380XXXXXXXXX"
                maxLength={13}
                style={{ 
                  borderColor: isPhoneValid ? 'var(--green)' : (phoneDigits > 0 ? 'var(--red)' : undefined), 
                  paddingRight: 36 
                }} 
              />
              {isPhoneValid && (
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--green)' }}>✔</span>
              )}
            </div>
          </div>

          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Пароль *</label>
              <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="мін. 8 символів" required minLength={8} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Підтвердження *</label>
              <input className="form-input" type="password" value={form.password2} onChange={e => set('password2', e.target.value)} placeholder="••••••••" required />
            </div>
          </div>

          <button className="btn btn-primary btn-lg w-full mt-4" type="submit" disabled={loading} style={{ marginTop: '24px' }}>
            {loading ? '...' : 'Зареєструватися →'}
          </button>
        </form>
        
        <div className="auth-link">Вже є акаунт? <Link to="/login">Увійти</Link></div>
      </div>
    </div>
  );
};

export default RegisterPage;
