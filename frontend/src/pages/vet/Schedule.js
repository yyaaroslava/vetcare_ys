import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAppointments, cancelAppointment, updateAppointment, createAppointment, getFreeSlots } from '../../api/appointments';
import { getClients, getVets } from '../../api/auth';
import { getAnimals } from '../../api/animals';
import { Modal, StatusBadge, Spinner, ConfirmModal, EmptyState, showToast, TimeSlotGrid } from '../../components/ui';
import { formatDate, formatTime, extractData } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

/**
 * Сторінка повного розкладу прийомів для лікаря.
 * Включає календар, фільтри та можливість ручного додавання записів.
 */

const MONTHS_UK = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
const DAYS_UK = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const TODAY = new Date();

function MiniCalendar({ appointments, onSelect, selected }) {
  const [month, setMonth] = useState(TODAY.getMonth());
  const [year, setYear] = useState(TODAY.getFullYear());
  const eventDates = new Set(appointments.map(a => a.date));
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const dateStr = d => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isToday = d => d === TODAY.getDate() && month === TODAY.getMonth() && year === TODAY.getFullYear();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button className="btn btn-outline btn-sm" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}>‹</button>
        <strong style={{ fontSize: 14 }}>{MONTHS_UK[month]} {year}</strong>
        <button className="btn btn-outline btn-sm" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}>›</button>
      </div>
      <div className="cal-grid">
        {DAYS_UK.map(d => <div key={d} className="cal-head">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i}
            className={`cal-day${!d ? ' empty' : ''}${d && isToday(d) ? ' today' : ''}${d && eventDates.has(dateStr(d)) ? ' has-event' : ''}${d && selected === dateStr(d) ? ' selected' : ''}`}
            onClick={() => d && onSelect(dateStr(d))}>
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Головна робоча область ветеринарного лікаря.
 * Відображає розклад на сьогодні та нові запити від клієнтів.
 */
export default function VetSchedule() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [duration, setDuration] = useState(60);
  const [sortOrder, setSortOrder] = useState('asc');
  const [tableDate, setTableDate] = useState('');
  const [timeFilter, setTimeFilter] = useState('today');

  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ client: '', animal: '', date: '', time: '', duration: 60, description: '', vet: '' });
  const [clients, setClients] = useState([]);
  const [allAnimals, setAllAnimals] = useState([]);
  const [vets, setVets] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    getAppointments().then(r => setAppointments(extractData(r))).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getClients().then(r => setClients(extractData(r)));
    getAnimals().then(r => setAllAnimals(extractData(r)));
    getVets().then(r => setVets(extractData(r)));
  }, []);

  /**
   * Завантаження вільних слотів при зміні дати або лікаря в формі додавання.
   */
  useEffect(() => {
    if (addForm.vet && addForm.date) {
      setSlotsLoading(true);
      getFreeSlots(addForm.vet, addForm.date)
        .then(r => setSlots(r.data))
        .catch(() => setSlots([]))
        .finally(() => setSlotsLoading(false));
    } else {
      setSlots([]);
    }
  }, [addForm.vet, addForm.date]);

  const handleCancel = async () => {
    await cancelAppointment(cancelTarget.id);
    showToast('Прийом скасовано');
    setCancelTarget(null);
    load();
  };

  const handleConfirm = async () => {
    await updateAppointment(confirmModal.id, { status: 'confirmed', duration });
    showToast('Прийом підтверджено!');
    setConfirmModal(null);
    load();
  };

  const openAddModal = () => {
    setAddForm({
      client: '',
      animal: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      duration: 60,
      description: '',
      vet: user?.id || '' // Автоматично підставляємо поточного лікаря
    });
    setAddModal(true);
  };

  const handleAddAppointment = async () => {
    if (!addForm.client || !addForm.animal || !addForm.date || !addForm.time || !addForm.vet) {
      showToast('Будь ласка, заповніть всі обов\'язкові поля (клієнт, тварина, лікар, дата та час)', 'error');
      return;
    }
    setSaving(true);
    try {
      await createAppointment({ ...addForm, status: 'confirmed' });
      showToast('Прийом створено!');
      setAddModal(false);
      setAddForm({ client: '', animal: '', date: '', time: '', duration: 60, description: '', vet: '' });
      load();
    } catch (err) {
      const msgs = Object.values(err.response?.data || {}).flat().join(' ');
      showToast(msgs || 'Помилка при створенні', 'error');
    } finally { setSaving(false); }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const pending = appointments.filter(a => a.status === 'pending' && a.date >= todayStr);

  let filtered = [...appointments];
  if (selectedDate) {
    filtered = filtered.filter(a => a.date === selectedDate);
  } else if (tableDate) {
    filtered = filtered.filter(a => a.date === tableDate);
  } else {
    if (timeFilter === 'today') filtered = filtered.filter(a => a.date === todayStr);
    if (timeFilter === 'future') filtered = filtered.filter(a => a.date > todayStr);
    if (timeFilter === 'all') filtered = filtered.filter(a => a.date >= todayStr);
  }


  if (loading) return <Spinner />;

  filtered.sort((a, b) => {
    const valA = `${a.date} ${a.time || '00:00'}`;
    const valB = `${b.date} ${b.time || '00:00'}`;
    return sortOrder === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div><div className="page-title">Розклад прийомів</div><div className="page-subtitle">Ваш робочий календар</div></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-teal" onClick={openAddModal}>+ Додати прийом</button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Календар</div>
            {selectedDate && <button className="btn btn-sm btn-gray" onClick={() => setSelectedDate(null)}>Скинути</button>}
          </div>
          <div className="card-body"><MiniCalendar appointments={appointments} onSelect={setSelectedDate} selected={selectedDate} /></div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Нові запити</div>
          </div>
          <div className="card-body" style={{ maxHeight: 460, overflowY: 'auto' }}>
            {pending.length === 0
              ? <EmptyState title="Нових запитів немає" />
              : pending.map(a => (
                <div key={a.id} className="appointment-block" style={{ padding: '16px 20px', borderLeft: '4px solid var(--orange)', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
                    <div style={{ minWidth: 100 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--orange)', lineHeight: 1 }}>{formatTime(a.time)}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginTop: 4 }}>{formatDate(a.date)}</div>
                    </div>
                    <div style={{ flex: 1, borderLeft: '2px solid var(--gray-100)', paddingLeft: 16 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{a.description || 'Запит на прийом'}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-700)' }}><strong>{a.animal_name}</strong></div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Власник: {a.client_name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                      <button className="btn btn-teal btn-sm" onClick={() => { setConfirmModal(a); setDuration(60); }}>Підтвердити</button>
                      <button className="btn btn-red btn-sm" onClick={() => setCancelTarget(a)}>Відхилити</button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="card-title">Всі прийоми {selectedDate && `— ${selectedDate}`}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <select className="form-select" style={{ width: 200 }} value={timeFilter} onChange={e => { setTimeFilter(e.target.value); setTableDate(''); setSelectedDate(''); }}>
              <option value="today">Сьогоднішні</option>
              <option value="future">Майбутні</option>
              <option value="all">Всі актуальні</option>
            </select>
            <select className="form-select" style={{ width: 160 }} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="desc">Спочатку нові</option>
              <option value="asc">Спочатку старі</option>
            </select>
            <input type="date" className="form-input" style={{ width: 160 }} value={tableDate} onChange={e => { setTableDate(e.target.value); setSelectedDate(null); }} />
            {(selectedDate || tableDate) && <button className="btn btn-gray btn-sm" onClick={() => { setSelectedDate(null); setTableDate(''); }}>Скинути</button>}
            <span className="badge badge-blue">{filtered.length}</span>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Дата</th><th>Час</th><th>Тварина</th><th>Власник</th><th>Опис</th><th>Статус</th><th style={{ textAlign: 'center' }}>Дії</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--gray-400)' }}>Немає прийомів</td></tr>
                : filtered.map(a => (
                  <tr key={a.id}>
                    <td>{formatDate(a.date)}</td>
                    <td>{formatTime(a.time)}{a.end_time ? ` – ${a.end_time}` : ''}</td>
                    <td>{a.animal_name}</td>
                    <td>{a.client_name}</td>
                    <td>{a.description || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td style={{ textAlign: 'center' }}>
                      <Link to={`/vet/patients/${a.animal}`} className="btn btn-teal" style={{ padding: '6px 12px', fontSize: '11px', textAlign: 'center', lineHeight: 1.2, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '90px', margin: '0 auto' }}>
                        Медична<br />картка
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модалки */}
      <Modal open={!!confirmModal} onClose={() => setConfirmModal(null)} title="Підтвердити прийом"
        actions={<><button className="btn btn-gray" onClick={() => setConfirmModal(null)}>Скасувати</button><button className="btn btn-teal" onClick={handleConfirm}>Підтвердити</button></>}>
        {confirmModal && (
          <div className="form-group">
            <label className="form-label">Тривалість (хв)</label>
            <select className="form-select" value={duration} onChange={e => setDuration(Number(e.target.value))}>
              <option value={30}>30 хвилин</option>
              <option value={60}>1 година</option>
              <option value={90}>1.5 години</option>
              <option value={120}>2 години</option>
            </select>
          </div>
        )}
      </Modal>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Додати прийом"
        actions={<><button className="btn btn-gray" onClick={() => setAddModal(false)}>Скасувати</button><button className="btn btn-teal" onClick={handleAddAppointment} disabled={saving}>Зберегти</button></>}>
        <div className="form-group">
          <label className="form-label">Клієнт *</label>
          <select className="form-select" value={addForm.client} onChange={e => setAddForm(f => ({ ...f, client: e.target.value, animal: '' }))}>
            <option value="">— Оберіть клієнта —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Тварина *</label>
          <select className="form-select" value={addForm.animal} onChange={e => setAddForm(f => ({ ...f, animal: e.target.value }))} disabled={!addForm.client}>
            <option value="">— Оберіть тварину —</option>
            {allAnimals.filter(a => String(a.owner) === String(addForm.client)).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Лікар *</label>
          <select className="form-select" value={addForm.vet} onChange={e => setAddForm(f => ({ ...f, vet: e.target.value }))}>
            <option value="">— Оберіть лікаря —</option>
            {vets.map(v => <option key={v.id} value={v.id}>{v.first_name} {v.last_name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Дата *</label>
          <input className="form-input" type="date" value={addForm.date} min={todayStr}
            onChange={e => setAddForm(f => ({ ...f, date: e.target.value, time: '' }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Час * <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 400 }}>(08:00–17:00)</span></label>
          <TimeSlotGrid 
            slots={slots} 
            selectedTime={addForm.time} 
            onSelect={time => setAddForm(f => ({ ...f, time }))} 
            loading={slotsLoading} 
          />
        </div>
      </Modal>

      <ConfirmModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        title="Скасувати прийом?" message={`Ви впевнені, що хочете скасувати прийом ${cancelTarget?.animal_name}?`} danger />
    </div>
  );
}
