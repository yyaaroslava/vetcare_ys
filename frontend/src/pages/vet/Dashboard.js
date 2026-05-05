import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAppointments, cancelAppointment, updateAppointment } from '../../api/appointments';
import { Spinner, StatusBadge, showToast, Modal, ConfirmModal } from '../../components/ui';

/**
 * Головна сторінка для ветеринарного лікаря.
 * Відображає прийоми на сьогодні та нові запити без зайвих іконок.
 */
export default function VetDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [confirmModal, setConfirmModal] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [duration, setDuration] = useState(60);

  const today = new Date().toISOString().split('T')[0];

  const load = () => getAppointments().then(ap => {
      setAppointments(ap.data.results || ap.data);
    })
    .catch(() => showToast('Помилка завантаження', 'error'))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await updateAppointment(confirmModal.id, { status: 'confirmed', duration });
      showToast('Прийом підтверджено!');
      setConfirmModal(null); 
      load();
    } catch { 
      showToast('Помилка', 'error'); 
    } finally { setSaving(false); }
  };

  const handleReject = async () => {
    setSaving(true);
    try {
      await cancelAppointment(rejectTarget.id);
      showToast('Запит відхилено');
      setRejectTarget(null); 
      load();
    } catch { 
      showToast('Помилка', 'error'); 
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner />;

  const todayAppts = appointments.filter(a => a.status === 'confirmed' && a.date === today);
  const pendingRequests = appointments.filter(a => a.status === 'pending' && a.date >= today);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Головна</div>
          <div className="page-subtitle">Сьогодні, {new Date().toLocaleDateString('uk-UA', { day:'numeric', month:'long', year:'numeric' })}</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Прийоми на сьогодні */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Прийоми на сьогодні</div>
          </div>
          <div className="card-body">
            {todayAppts.length === 0 ? (
              <div style={{textAlign:'center', padding:'30px 0', color:'var(--gray-400)', fontSize:14}}>Підтверджених прийомів на сьогодні немає</div>
            ) : todayAppts.map(a => (
              <div key={a.id} className="appointment-block" style={{padding: '16px 20px', borderLeft: '4px solid var(--teal)', marginBottom: 12}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap: 20}}>
                  <div style={{minWidth: 100}}>
                    <div style={{fontSize: 24, fontWeight: 900, color: 'var(--teal)', lineHeight: 1}}>{a.time?.slice(0,5)}</div>
                    <div style={{fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginTop: 4}}>{a.duration} хв.</div>
                  </div>
                  <div style={{flex: 1, borderLeft: '2px solid var(--gray-100)', paddingLeft: 16}}>
                    <div style={{fontSize: 15, fontWeight: 700}}>{a.description || 'Огляд'}</div>
                    <div style={{fontSize: 13, color: 'var(--gray-700)', marginTop: 2}}><strong>{a.animal_name}</strong></div>
                    <div style={{fontSize: 12, color: 'var(--gray-500)'}}>Власник: {a.client_name}</div>
                  </div>
                  <div>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Нові запити */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Нові запити</div>
          </div>
          <div className="card-body">
            {pendingRequests.length === 0 ? (
              <div style={{textAlign:'center', padding:'30px 0', color:'var(--gray-400)', fontSize:14}}>Нових запитів немає</div>
            ) : pendingRequests.map(a => (
              <div key={a.id} className="appointment-block" style={{padding: '16px 20px', borderLeft: '4px solid var(--orange)', marginBottom: 12}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap: 20}}>
                  <div style={{minWidth: 100}}>
                    <div style={{fontSize: 24, fontWeight: 900, color: 'var(--orange)', lineHeight: 1}}>{a.time?.slice(0,5)}</div>
                    <div style={{fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginTop: 4}}>{a.date}</div>
                  </div>
                  <div style={{flex: 1, borderLeft: '2px solid var(--gray-100)', paddingLeft: 16}}>
                    <div style={{fontSize: 15, fontWeight: 700}}>{a.description || 'Запит на прийом'}</div>
                    <div style={{fontSize: 13, color: 'var(--gray-700)'}}><strong>{a.animal_name}</strong></div>
                    <div style={{fontSize: 12, color: 'var(--gray-500)'}}>Власник: {a.client_name}</div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap: 6}}>
                    <button className="btn btn-teal btn-sm" onClick={() => { setConfirmModal(a); setDuration(60); }}>Підтвердити</button>
                    <button className="btn btn-red btn-sm" onClick={() => setRejectTarget(a)}>Відхилити</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={!!confirmModal} onClose={() => setConfirmModal(null)} title="Підтвердження прийому"
        actions={<><button className="btn btn-gray" onClick={() => setConfirmModal(null)}>Скасувати</button><button className="btn btn-teal" onClick={handleConfirm} disabled={saving}>Підтвердити</button></>}>
        {confirmModal && (
          <div>
            <div style={{marginBottom: 16, padding: 12, background: 'var(--teal-bg)', borderRadius: 10}}>
              <strong>{confirmModal.animal_name}</strong><br/>
              <span style={{fontSize: 13, color: 'var(--gray-600)'}}>{confirmModal.date} о {confirmModal.time?.slice(0,5)}</span>
            </div>
            <div className="form-group">
              <label className="form-label">Тривалість (хвилин)</label>
              <select className="form-select" value={duration} onChange={e=>setDuration(Number(e.target.value))}>
                <option value={30}>30 хвилин</option>
                <option value={60}>1 година</option>
                <option value={90}>1.5 години</option>
                <option value={120}>2 години</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleReject}
        title="Відхилити запит?" message={`Ви впевнені, що хочете відхилити запит на прийом від ${rejectTarget?.client_name}?`} danger />
    </div>
  );
}
