import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAnimals } from '../../api/animals';
import { getAppointments, cancelAppointment } from '../../api/appointments';
import { getVisits } from '../../api/visits';
import { Spinner, StatusBadge, speciesEmoji, Modal, ConfirmModal, showToast } from '../../components/ui';

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [animals, setAnimals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const loadData = () => {
    Promise.all([getAnimals(), getAppointments(), getVisits()])
      .then(([a, ap, v]) => {
        setAnimals(a.data.results || a.data);
        setAppointments(ap.data.results || ap.data);
        setVisits(v.data.results || v.data);
      }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = async () => {
    try {
      await cancelAppointment(cancelTarget.id);
      showToast('Прийом скасовано');
      setCancelTarget(null);
      loadData();
    } catch (err) {
      showToast('Помилка при скасуванні', 'error');
    }
  };

  if (loading) return <Spinner />;

  const todayStr = new Date().toISOString().split('T')[0];

  // Show all upcoming appointments (will be scrollable)
  const nearestAppointments = appointments
    .filter(a => ['pending', 'confirmed'].includes(a.status) && a.date >= todayStr)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  // History: only completed or cancelled
  const visitHistory = visits
    .filter(v => ['completed', 'cancelled', 'done'].includes(v.status))
    .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Вітаємо, {user?.first_name}!</div>
        </div>
      </div>

      <div className="grid-2">
        {/* My animals */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Мої тварини</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/client/pets?action=new" className="btn btn-teal btn-sm">+ Додати тварину</Link>
              <Link to="/client/pets" className="btn btn-outline btn-sm">Всі →</Link>
            </div>
          </div>
          <div className="card-body">
            {animals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gray-400)' }}>
                Тварин немає. <Link to="/client/pets" style={{ color: 'var(--teal)' }}>Додати →</Link>
              </div>
            ) : animals.slice(0, 4).map(a => (
              <div key={a.id}
                onClick={() => navigate(`/client/pets/${a.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }}
                className="pet-row-hover">
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--teal-bg)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
                  {a.name?.slice(0, 1)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{a.species_display}</div>
                </div>
                <span className="btn btn-outline btn-sm" style={{ pointerEvents: 'none' }}>Медична картка →</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nearest appointment */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Найближчі прийоми</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="badge badge-teal">{nearestAppointments.length}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to="/client/appointments?action=new" className="btn btn-teal btn-sm">Записатися</Link>
                <Link to="/client/appointments" className="btn btn-outline btn-sm">Всі</Link>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ padding: '20px', maxHeight: 280, overflowY: 'auto' }}>
            {nearestAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gray-400)' }}>Немає запланованих прийомів</div>
            ) : (
              nearestAppointments.map(a => (
                <div key={a.id} className="appointment-block" style={{ padding: '20px', background: 'var(--teal-bg)', borderRadius: 16, marginBottom: 12, border: '1px solid rgba(13,148,136,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ minWidth: 90, textAlign: 'center' }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--teal)', lineHeight: 1 }}>{a.time?.slice(0, 5)}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-500)', marginTop: 6 }}>{a.date}</div>
                    </div>

                    <div style={{ flex: 1, borderLeft: '1px solid var(--gray-200)', paddingLeft: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 2 }}>{a.description || 'Прийом'}</div>
                          <div style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 12 }}>{a.animal_name}</div>
                          <StatusBadge status={a.status} />
                        </div>
                        <button className="btn btn-red" style={{ borderRadius: 12, padding: '10px 20px' }} onClick={() => setCancelTarget(a)}>Скасувати</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>


      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Деталі візиту — ${detail?.animal_name}`}
        actions={<button className="btn btn-gray" onClick={() => setDetail(null)}>Закрити</button>}>
        {detail && (
          <div>
            <div className="detail-row"><span className="detail-label">Дата</span><span className="detail-value">{detail.visit_date}</span></div>
            <div className="detail-row"><span className="detail-label">Тварина</span><span className="detail-value">{detail.animal_name}</span></div>
            <div className="detail-row"><span className="detail-label">Лікар</span><span className="detail-value">{detail.vet_name}</span></div>

            <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--teal-bg)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal-dark)', marginBottom: 6 }}>ДІАГНОЗ / ВИСНОВОК</div>
              <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>
                {detail.status === 'cancelled' ? 'Клієнт не з\'явився' : detail.diagnosis}
              </div>
            </div>

            {detail.prescription && detail.status !== 'cancelled' && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 10, border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 6 }}>ПРИЗНАЧЕННЯ / РЕКОМЕНДАЦІЇ</div>
                <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{detail.prescription}</div>
              </div>
            )}

            <div style={{ marginTop: 16 }}><StatusBadge status={detail.status} /></div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        title="Скасувати прийом?" message={`Ви дійсно хочете скасувати прийом на ${cancelTarget?.date} о ${cancelTarget?.time?.slice(0, 5)}?`} danger />
    </div>
  );
}
