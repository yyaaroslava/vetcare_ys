import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { getAppointments, createAppointment, cancelAppointment } from '../../api/appointments';
import { getAnimals } from '../../api/animals';
import { getVets } from '../../api/auth';
import { Modal, StatusBadge, Spinner, ConfirmModal, TimeSlotGrid, EmptyState, showToast, SearchBar } from '../../components/ui';
import { formatDate, formatTime, extractData } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

/**
 * Сторінка керування записами на прийом для клієнта.
 * Включає календар, список найближчих візитів та форму бронювання.
 */

const TODAY = new Date();
const MONTHS_UK = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

/**
 * Компонент міні-календаря для візуалізації дат записів.
 */
function MiniCalendar({ appointments, onSelect, selected }) {
  const [month, setMonth] = useState(TODAY.getMonth());
  const [year, setYear] = useState(TODAY.getFullYear());
  const eventDates = new Set(appointments.map(a => a.date));

  // Sunday start (0)
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateStr = d => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isToday = d => d === TODAY.getDate() && month === TODAY.getMonth() && year === TODAY.getFullYear();
  const UK_DAYS_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  return (
    <div style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button className="btn btn-outline" style={{ width: 32, height: 32, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}>‹</button>
        <strong style={{ fontSize: 14, color: 'var(--gray-800)', fontWeight: 700 }}>{MONTHS_UK[month]} {year}</strong>
        <button className="btn btn-outline" style={{ width: 32, height: 32, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px 8px', textAlign: 'center' }}>
        {UK_DAYS_SHORT.map(d => (
          <div key={d} style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', paddingBottom: 8 }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const ds = dateStr(d);
          const hasEv = eventDates.has(ds);
          const isSel = selected === ds;
          const isT = isToday(d);

          return (
            <div key={ds}
              onClick={() => onSelect(ds)}
              style={{
                padding: '10px 0',
                fontSize: 14,
                fontWeight: isT || isSel ? 700 : 400,
                cursor: 'pointer',
                borderRadius: 6,
                transition: 'all 0.2s',
                background: isSel ? 'var(--teal)' : isT || hasEv ? '#e6f0ff' : 'transparent',
                color: isSel ? 'white' : isT || hasEv ? '#0066cc' : 'var(--gray-700)',
                border: isSel ? 'none' : isT ? '1px solid #0066cc' : 'none'
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ClientAppointments() {
  const { user } = useAuth();
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  // Якщо ми прийшли з медкарти, встановлюємо ID тварини відразу
  const initialAnimal = location.state?.animalId || '';
  const [form, setForm] = useState({ animal: initialAnimal, vet: '', date: '', time: '', description: '' });

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Відкриваємо модалку відразу, якщо є animalId в state
  useEffect(() => {
    if (location.state?.animalId) {
      setModal(true);
    }
  }, [location.state]);

  /**
   * Завантаження даних: записи, тварини та доступні лікарі.
   */
  const load = () => getAppointments().then(r => setAppointments(extractData(r))).finally(() => setLoading(false));

  useEffect(() => {
    load();
    getAnimals().then(r => setAnimals(extractData(r)));
    getVets().then(r => setVets(extractData(r)));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /**
   * Автоматичне завантаження вільних часових слотів при зміні дати або лікаря.
   */
  useEffect(() => {
    if (form.vet && form.date) {
      setSlotsLoading(true);
      api.get('/appointments/free-slots/', { params: { vet: form.vet, date: form.date } })
        .then(r => setSlots(r.data))
        .catch(() => setSlots([]))
        .finally(() => setSlotsLoading(false));
    } else {
      setSlots([]);
    }
  }, [form.vet, form.date]);

  /**
   * Створення нового запису на прийом.
   */
  const handleSave = async () => {
    const missing = [];
    if (!form.animal) missing.push('Тварина');
    if (!form.vet) missing.push('Лікар');
    if (!form.date) missing.push('Дата');
    if (!form.time) missing.push('Час');

    if (missing.length > 0) {
      showToast(`Будь ласка, заповніть обов'язкові поля: ${missing.join(', ')}`, 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (user?.role === 'doctor') {
        payload.status = 'confirmed';
      }
      
      await createAppointment(payload);
      showToast('Запис успішно створено!');
      setModal(false);
      setForm({ animal: '', vet: '', date: '', time: '', description: '' });
      load();
    } catch (err) {
      const msgs = Object.values(err.response?.data || {}).flat().join(' ');
      showToast(msgs || 'Помилка', 'error');
    } finally { setSaving(false); }
  };

  /**
   * Скасування запланованого прийому.
   */
  const handleCancel = async () => {
    try {
      await cancelAppointment(cancelTarget.id);
      showToast('Прийом скасовано');
      setCancelTarget(null);
      load();
    } catch (err) {
      showToast('Помилка при скасуванні', 'error');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const [filterType, setFilterType] = useState('upcoming'); // майбутні, історія, усі
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = нові зверху, asc = старі зверху

  // Обробка параметра action=new з Головної сторінки
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setModal(true);
    }
  }, [location]);

  if (loading) return <Spinner />;

  const filteredTable = appointments.filter(a => {
    // Обрана дата з календаря
    if (selectedDate && a.date !== selectedDate) return false;

    // Фільтрація за обраною датою
    if (filterDate && a.date !== filterDate) return false;

    // Фільтрація за типом: історія, сьогодні, майбутні, усі
    if (filterType === 'today') if (a.date !== todayStr) return false;
    if (filterType === 'upcoming') if (a.date <= todayStr) return false;
    if (filterType === 'history') if (!(a.date < todayStr || a.status === 'cancelled')) return false;

    if (filterStatus && a.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.description?.toLowerCase().includes(q) ||
        a.vet_name?.toLowerCase().includes(q) ||
        a.animal_name?.toLowerCase().includes(q)
      );
    }

    return true;
  }).sort((a, b) => {
    const valA = `${a.date} ${a.time}`;
    const valB = `${b.date} ${b.time}`;
    return sortOrder === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
  });

  const upcoming = appointments
    .filter(a => ['pending', 'confirmed'].includes(a.status) && a.date >= todayStr)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Записи на прийом</div>
          <div className="page-subtitle">Управління вашими візитами до клініки</div>
        </div>
        <button className="btn btn-teal" onClick={() => setModal(true)}>+ Записатися</button>
      </div>

      <div className="grid-2">
        {/* Блок календаря */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header" style={{ background: 'var(--teal)', color: 'white' }}>
            <div className="card-title" style={{ color: 'white' }}>Календар</div>
            {selectedDate && <button className="btn btn-sm btn-gray" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }} onClick={() => setSelectedDate(null)}>✕ Скинути</button>}
          </div>
          <div className="card-body">
            <MiniCalendar appointments={appointments} onSelect={setSelectedDate} selected={selectedDate} />
          </div>
        </div>

        {/* Блок найближчих прийомів */}
        <div>
          <div className="card">
            <div className="card-header" style={{ background: 'var(--teal)', color: 'white' }}>
              <div className="card-title" style={{ color: 'white' }}>Найближчі прийоми</div>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>{upcoming.length}</span>
            </div>
            <div className="card-body" style={{ maxHeight: 280, overflowY: 'auto', padding: '20px' }}>
              {upcoming.length === 0 ? <EmptyState icon="" title="Немає запланованих прийомів" />
                : upcoming.map(a => (
                  <div key={a.id} className="appointment-block" style={{ padding: '20px', background: 'var(--teal-bg)', borderRadius: 16, marginBottom: 12, border: '1px solid rgba(13,148,136,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                      <div style={{ minWidth: 90, textAlign: 'center' }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--teal)', lineHeight: 1 }}>{formatTime(a.time)}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-500)', marginTop: 6 }}>{formatDate(a.date)}</div>
                      </div>

                      <div style={{ flex: 1, borderLeft: '1px solid var(--gray-200)', paddingLeft: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 2 }}>{a.description || 'Прийом'}</div>
                            <div style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 12 }}>Пацієнт: <strong>{a.animal_name}</strong></div>
                            <StatusBadge status={a.status} />
                          </div>
                          {['pending', 'confirmed'].includes(a.status) && (
                            <button className="btn btn-red" style={{ borderRadius: 12, padding: '10px 20px' }} onClick={() => setCancelTarget(a)}>Скасувати</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Таблиця всіх записів */}
      <SearchBar search={search} onSearchChange={setSearch}
        sortOrder={sortOrder} onSortChange={setSortOrder}
        hasFilters={!!(search || filterDate || filterStatus)}
        onReset={() => { setSearch(''); setFilterDate(''); setFilterStatus(''); }} />

      <div className="card mt-4">
        <div className="card-header">
          <div className="card-title">Історія записів</div>
          <span className="badge badge-teal">{filteredTable.length}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead style={{ background: 'var(--teal)', color: '#fff' }}>
              <tr style={{ fontSize: 15 }}><th>Дата</th><th>Час</th><th>Тварина</th><th>Лікар</th><th>Опис</th><th>Статус</th><th style={{ textAlign: 'center' }}>Дії</th></tr>
              <tr style={{ background: 'var(--teal-dark)' }}>
                <th>
                  <input type="date" className="form-input input-xs" style={{ padding: '2px 4px', fontSize: 11, color: '#000' }}
                    value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                </th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th>
                  <select className="form-select input-xs" style={{ padding: '2px 4px', fontSize: 11, color: '#000' }}
                    value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Всі</option>
                    <option value="pending">Очікується</option>
                    <option value="confirmed">Підтверджено</option>
                    <option value="completed">Виконано</option>
                    <option value="cancelled">Скасовано</option>
                  </select>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTable.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--gray-400)' }}>Записів не знайдено</td></tr>
                : filteredTable.map(a => (
                  <tr key={a.id}>
                    <td>{formatDate(a.date)}</td>
                    <td>{formatTime(a.time)}</td>
                    <td>{a.animal_name}</td><td>{a.vet_name}</td>
                    <td>{a.description || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td style={{ textAlign: 'center' }}>{['pending', 'confirmed'].includes(a.status) && (
                      <button className="btn btn-red btn-sm" onClick={() => setCancelTarget(a)}>Скасувати</button>
                    )}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальне вікно запису */}
      <Modal open={modal} onClose={() => setModal(false)} title="Записатися на прийом"
        actions={<>
          <button className="btn btn-gray" onClick={() => setModal(false)}>Скасувати</button>
          <button className="btn btn-teal" onClick={handleSave} disabled={saving || !form.animal || !form.vet || !form.date || !form.time}>
            {saving ? '...' : 'Записатися'}
          </button>
        </>}>
        <div className="form-group">
          <label className="form-label">Тварина *</label>
          <select className="form-select" value={form.animal} onChange={e => set('animal', e.target.value)}>
            <option value="">— Оберіть тварину —</option>
            {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Лікар *</label>
          <select className="form-select" value={form.vet} onChange={e => set('vet', e.target.value)}>
            <option value="">— Оберіть лікаря —</option>
            {vets.map(v => <option key={v.id} value={v.id}>{v.first_name} {v.last_name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Дата *</label>
          <input className="form-input" type="date" value={form.date}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => { set('date', e.target.value); set('time', ''); }} />
        </div>
        <div className="form-group">
          <label className="form-label">Час * <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 400 }}>(08:00–17:00)</span></label>
          <TimeSlotGrid 
            slots={slots} 
            selectedTime={form.time} 
            onSelect={time => set('time', time)} 
            loading={slotsLoading} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Опис проблеми</label>
          <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Опишіть причину звернення..." />
        </div>
      </Modal>

      <ConfirmModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        title="Скасувати прийом?" message={`Скасувати прийом ${cancelTarget?.animal_name} на ${cancelTarget?.date}?`} danger />
    </div>
  );
}
