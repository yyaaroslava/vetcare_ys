import React, { useEffect, useState } from 'react';
import { getAppointments, updateAppointment, cancelAppointment } from '../../api/appointments';
import { Spinner, StatusBadge, EmptyState, showToast, ConfirmModal, speciesEmoji } from '../../components/ui';

/**
 * Журнал всіх записів на прийом для адміністрації клініки.
 * Дозволяє контролювати статуси, підтверджувати або скасовувати записи.
 */
export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = () => getAppointments().then(r => setAppointments(r.data.results || r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCancel = async () => {
    await cancelAppointment(confirm.id);
    showToast('Прийом скасовано');
    setConfirm(null); load();
  };

  const handleStatusChange = async (a, status) => {
    await updateAppointment(a.id, { status });
    showToast('Статус оновлено');
    load();
  };

  if (loading) return <Spinner />;

  let filtered = appointments.filter(a =>
    a.animal_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.vet_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Всі прийоми</div>
          <div className="page-subtitle">Журнал записів клініки</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{flex: 1}}>
            <div className="card-title">Журнал записів</div>
            <div style={{fontSize: 12, color: 'var(--gray-500)', marginTop: 2}}>Знайдено записів: {filtered.length}</div>
          </div>
          <input className="form-input" style={{ width: 320 }} placeholder="Пошук за твариною, клієнтом..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        
        {filtered.length === 0 ? (
          <div className="card-body"><EmptyState icon="" title="Прийомів не знайдено" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Дата/Час</th><th>Тварина</th><th>Клієнт</th><th>Лікар</th><th>Опис</th><th>Статус</th><th>Дії</th></tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.date}</strong><br /><span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{a.time?.slice(0, 5)}</span></td>
                    <td>{speciesEmoji(a.animal_species)} {a.animal_name}</td>
                    <td>{a.client_name}</td>
                    <td>{a.vet_name}</td>
                    <td>{a.description || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      {a.status === 'pending' && (
                        <button className="btn btn-teal btn-sm" onClick={() => handleStatusChange(a, 'confirmed')}>Підтвердити</button>
                      )}
                      {['pending', 'confirmed'].includes(a.status) && (
                        <button className="btn btn-red btn-sm" onClick={() => setConfirm(a)}>Скасувати</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleCancel}
        title="Скасувати прийом?" message={`Скасувати запис для ${confirm?.animal_name}?`} danger />
    </div>
  );
}
