import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menus = {
  client: [
    { section: 'Головне' },
    { to: '/client', label: 'Головна', end: true },
    { to: '/client/pets', label: 'Мої тварини' },
    { to: '/client/appointments', label: 'Записи на прийом' },
  ],
  doctor: [
    { section: 'Робота' },
    { to: '/vet', label: 'Головна', end: true },
    { to: '/vet/schedule', label: 'Розклад прийомів' },
    { to: '/vet/patients', label: 'Пацієнти' },
  ],
  admin: [
    { section: 'Управління' },
    { to: '/admin', label: 'Головна', end: true },
    { to: '/admin/users', label: 'Користувачі' },
    { to: '/admin/animals', label: 'Тварини' },
    { to: '/admin/appointments', label: 'Всі прийоми' },
  ],
};

const roleLabels = { client: 'Власник тварини', doctor: 'Ветеринарний лікар', admin: 'Адміністратор' };

export default function Sidebar({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = menus[role] || [];

  // Функція виходу
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">VetCare</div>
        </div>
        <div className="sidebar-role">{roleLabels[role]}</div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{user?.first_name} {user?.last_name}</div>
            <div className="user-role">{user?.email}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Вийти">Вихід</button>
        </div>
      </div>
    </div>
  );
}
