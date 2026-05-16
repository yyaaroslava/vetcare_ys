import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAppointments, cancelAppointment, updateAppointment } from '../../api/appointments';
import { getAnimals } from '../../api/animals';
import { getVisits, createVisit } from '../../api/visits';
import { Spinner, StatusBadge, showToast, Modal, ConfirmModal } from '../../components/ui';
import { extractData } from '../../utils/formatters';
import VaccinationModal from '../../components/ui/VaccinationModal';

/**
 * Робочий стіл ветеринарного лікаря.
 * Показує прийоми на сьогодні та нові запити.
 * Дозволяє фіксувати результати візитів.
 */

export default function VetDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [visitModal, setVisitModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [vForm, setVForm] = useState({ diagnosis: '', prescription: '', status: 'completed', weight_at_visit: '', temperature: '' });

  const [noshowTarget, setNoshowTarget] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [duration, setDuration] = useState(60);
  const [saving, setSaving] = useState(false);
  const [vacModal, setVacModal] = useState(false);
  const [vacData, setVacData] = useState({ animalId: '', ownerId: '' });
  const today = new Date().toLocaleDateString('en-CA');

  const load = () => Promise.all([
    getAppointments(), // Отримуємо всі, щоб бачити нові запити на майбутнє
    getAnimals(),
    getVisits(),
  ]).then(([ap, an, vi]) => {
    setAppointments(extractData(ap));
    setAnimals(extractData(an));
  }).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openVisit = (appt) => {
    setSelected(appt);
    setVForm({
      diagnosis: '',
      prescription: '',
      status: 'completed',
      weight_at_visit: '',
      temperature: '',
      animal: appt.animal,
      appointment: appt.id
    });
    setVisitModal(true);
  };

  const handleVisitSave = async () => {
    if (!vForm.diagnosis) {
      showToast('Будь ласка, вкажіть діагноз', 'error');
      return;
    }
    setSaving(true);
    try {
      const visitData = {
        appointment: selected.id,
        diagnosis: vForm.diagnosis,
        prescription: vForm.prescription,
      };

      await createVisit(visitData);
      await updateAppointment(selected.id, { status: 'completed' });

      showToast('Візит зафіксовано!');
      setVisitModal(false);
      load();
    } catch (err) {
      showToast(Object.values(err.response?.data || {}).flat().join(' ') || 'Помилка', 'error');
    } finally { setSaving(false); }
  };

  const handleNoshowConfirm = async () => {
    setSaving(true);
    try {
      const visitData = {
        appointment: noshowTarget.id,
        diagnosis: 'Пацієнт не з\'явився на прийом',
        prescription: '',
      };
      await createVisit(visitData);
      await updateAppointment(noshowTarget.id, { status: 'cancelled' });
      showToast('Відмічено неявку');
      setNoshowTarget(null);
      load();
    } catch (err) {
      showToast('Помилка при фіксації неявки', 'error');
    } finally { setSaving(false); }
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await updateAppointment(confirmModal.id, { status: 'confirmed', duration });
      showToast('Прийом підтверджено!');
      setConfirmModal(null); load();
    } catch { showToast('Помилка', 'error'); }
    finally { setSaving(false); }
  };

  const handleReject = async () => {
    setSaving(true);
    try {
      await cancelAppointment(rejectTarget.id);
      showToast('Запит відхилено');
      setRejectTarget(null); load();
    } catch { showToast('Помилка', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner />;

  const todayAppts = appointments.filter(a => a.status === 'confirmed' && a.date === today);
  const pendingRequests = appointments.filter(a => a.status === 'pending' && a.date >= today);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Робочий стіл</div>
          <div className="page-subtitle">Сьогодні, {new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div className="grid-2 mt-6">
        {/* Прийоми на сьогодні */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Прийоми сьогодні</div>
            {todayAppts.length > 0 && <span className="badge badge-teal">{todayAppts.length}</span>}
          </div>
          <div className="card-body">
            {todayAppts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gray-400)' }}>Підтверджених прийомів немає</div>
            ) : todayAppts.map(a => (
              <div key={a.id} className="appointment-block" style={{ padding: '16px 20px', borderLeft: '4px solid var(--teal)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
                  <div style={{ minWidth: 140 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--teal)', lineHeight: 1 }}>
                      {a.time?.slice(0, 5)} – {a.end_time || '??'}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginTop: 4, textTransform: 'uppercase' }}>Час прийому</div>
                  </div>

                  <div style={{ flex: 1, borderLeft: '2px solid var(--gray-100)', paddingLeft: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{a.description || 'Прийом'}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-700)' }}><strong>{a.animal_name}</strong></div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>Власник: {a.client_name}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                    <button className="btn btn-teal btn-sm" onClick={() => openVisit(a)}>Прийняти</button>
                    <button className="btn btn-red btn-sm" onClick={() => setNoshowTarget(a)}>Неявка</button>
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
            {pendingRequests.length > 0 && <span className="badge badge-orange">{pendingRequests.length}</span>}
          </div>
          <div className="card-body">
            {pendingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gray-400)' }}>Нових запитів немає</div>
            ) : pendingRequests.map(a => (
              <div key={a.id} className="appointment-block" style={{ padding: '16px 20px', borderLeft: '4px solid var(--orange)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--orange)', lineHeight: 1 }}>{a.time?.slice(0, 5)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginTop: 4 }}>{a.date}</div>
                  </div>

                  <div style={{ flex: 1, borderLeft: '2px solid var(--gray-100)', paddingLeft: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{a.description || 'Запит на прийом'}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-700)' }}><strong>{a.animal_name}</strong></div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>Власник: {a.client_name}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                    <button className="btn btn-teal btn-sm" onClick={() => { setConfirmModal(a); setDuration(60); }}>Підтвердити</button>
                    <button className="btn btn-red btn-sm" onClick={() => setRejectTarget(a)}>Відхилити</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visit Fixation Modal */}
      <Modal open={visitModal} onClose={() => setVisitModal(false)} title={`Фіксація прийому — ${selected?.animal_name}`}
        actions={<>
          <button className="btn btn-gray" onClick={() => setVisitModal(false)}>Скасувати</button>
          <button className="btn btn-teal" onClick={handleVisitSave} disabled={saving}>{saving ? '...' : 'Зберегти'}</button>
        </>}>
        <div className="form-group">
          <label className="form-label">Діагноз / Опис *</label>
          <textarea className="form-textarea"
            value={vForm.diagnosis}
            onChange={e => setVForm(f => ({ ...f, diagnosis: e.target.value }))}
            placeholder="Висновок лікаря..." />
        </div>
        <div className="form-group">
          <label className="form-label">Призначення</label>
          <textarea className="form-textarea" value={vForm.prescription} onChange={e => setVForm(f => ({ ...f, prescription: e.target.value }))} placeholder="Препарати, процедури..." />
        </div>
        <div className="form-group">
          <button type="button" className="btn btn-outline w-full" onClick={() => {
            setVacData({ animalId: selected?.animal, ownerId: selected?.client });
            setVacModal(true);
          }}>
            Зареєструвати вакцинацію
          </button>
        </div>

      </Modal>

      <ConfirmModal open={!!noshowTarget} onClose={() => setNoshowTarget(null)} onConfirm={handleNoshowConfirm}
        title="Відмітити неявку?"
        message={`Пацієнт ${noshowTarget?.animal_name} не з'явився на прийом. Запис про неявку буде додано до журналу візитів.`}
        danger />

      <Modal open={!!confirmModal} onClose={() => setConfirmModal(null)} title="Підтвердити прийом"
        actions={<>
          <button className="btn btn-gray" onClick={() => setConfirmModal(null)}>Скасувати</button>
          <button className="btn btn-teal" onClick={handleConfirm} disabled={saving}>{saving ? '...' : 'Підтвердити'}</button>
        </>}>
        {confirmModal && (
          <div>
            <div style={{ padding: '12px 14px', background: 'var(--teal-bg)', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontWeight: 700 }}>{confirmModal.animal_name}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                {confirmModal.date}, {confirmModal.time?.slice(0, 5)} · {confirmModal.client_name}
              </div>
              {confirmModal.description && <div style={{ fontSize: 13, marginTop: 6 }}>💬 {confirmModal.description}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Тривалість прийому</label>
              <select className="form-select" value={duration} onChange={e => setDuration(Number(e.target.value))}>
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
        title="Відхилити запит?" message={`Відхилити запит на прийом ${rejectTarget?.animal_name} від ${rejectTarget?.client_name}?`} danger />

      <VaccinationModal
        open={vacModal}
        onClose={() => setVacModal(false)}
        onSuccess={load}
        initialAnimalId={vacData.animalId}
        initialOwnerId={vacData.ownerId}
      />
    </div>
  );
}
