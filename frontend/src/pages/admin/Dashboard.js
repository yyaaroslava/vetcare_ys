import React, { useEffect, useState } from 'react';
import { getUsers } from '../../api/auth';
import { getAnimals } from '../../api/animals';
import { getAppointments } from '../../api/appointments';
import { Spinner, StatusBadge, roleLabel, roleBadgeColor, Badge } from '../../components/ui';
import { extractData } from '../../utils/formatters';

/**
 * Головна панель адміністратора.
 * Відображає зведену статистику по користувачах, тваринах та записах на прийом.
 */
export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUsers(), getAnimals(), getAppointments()])
      .then(([u, a, ap]) => {
        setUsers(extractData(u));
        setAnimals(extractData(a));
        setAppointments(extractData(ap));
      }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const clients = users.filter(u => u.role === 'client');
  const vets = users.filter(u => u.role === 'doctor' || u.role === 'vet');
  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const recent = appointments.slice(0, 5);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Панель адміністратора</div>
          <div className="page-subtitle">Загальний огляд системи</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{clients.length}</div>
          <div className="stat-label">Клієнтів</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{vets.length}</div>
          <div className="stat-label">Лікарів</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{animals.length}</div>
          <div className="stat-label">Тварин у системі</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{upcoming.length}</div>
          <div className="stat-label">Запланованих прийомів</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Нові користувачі</div>
            <span className="badge badge-blue">{users.length} всього</span>
          </div>
          <div className="card-body">
            {users.slice(0, 5).map(u => {
              const initials = `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase() || u.email[0].toUpperCase();
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--teal-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{u.first_name} {u.last_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{u.email}</div>
                  </div>
                  <Badge color={roleBadgeColor(u.role)}>{roleLabel(u.role)}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Останні прийоми</div>
          </div>
          <div className="card-body">
            {recent.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '20px 0' }}>Прийомів немає</div>
            ) : recent.map(a => (
              <div key={a.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.animal_name}</div>
                  <StatusBadge status={a.status} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 3 }}>
                  {a.date}, {a.time?.slice(0, 5)} · {a.vet_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
