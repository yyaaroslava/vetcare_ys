import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { getAppointments, createAppointment, cancelAppointment } from '../../api/appointments';
import { getAnimals } from '../../api/animals';
import { getVets } from '../../api/auth';
import { Spinner, Modal, StatusBadge, EmptyState, showToast, ConfirmModal, speciesEmoji } from '../../components/ui';

/**
 * Сторінка керування записами на прийом для клієнта.
 * Включає календар, список найближчих візитів та форму бронювання.
 */

const TODAY = new Date();
const MONTHS_UK = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const DAYS_UK = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];

/**
 * Компонент міні-календаря для візуалізації дат записів.
 */
function MiniCalendar({ appointments, onSelect, selected }) {
  const [month, setMonth] = useState(TODAY.getMonth());
  const [year, setYear] = useState(TODAY.getFullYear());
  const eventDates = new Set(appointments.map(a => a.date));
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const dateStr = d => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const isToday = d => d === TODAY.getDate() && month === TODAY.getMonth() && year === TODAY.getFullYear();
  
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <button className="btn btn-outline btn-sm" onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}>‹</button>
        <strong style={{fontSize:14}}>{MONTHS_UK[month]} {year}</strong>
        <button className="btn btn-outline btn-sm" onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}>›</button>
      </div>
      <div className="cal-grid">
        {DAYS_UK.map(d => <div key={d} className="cal-head">{d}</div>)}
        {cells.map((d, i) => (
          <div key={i}
            className={`cal-day${!d?' empty':''}${d&&isToday(d)?' today':''}${d&&eventDates.has(dateStr(d))?' has-event':''}${d&&selected===dateStr(d)?' selected':''}`}
            onClick={() => d && onSelect(dateStr(d))}>
            {d||''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClientAppointments() {
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

  // Відкриваємо модалку відразу, якщо є animalId в state
  useEffect(() => {
    if (location.state?.animalId) {
      setModal(true);
    }
  }, [location.state]);

  /**
   * Завантаження даних: записи, тварини та доступні лікарі.
   */
  const load = () => getAppointments().then(r => setAppointments(r.data.results || r.data)).finally(() => setLoading(false));
  
  useEffect(() => {
    load();
    getAnimals().then(r => setAnimals(r.data.results || r.data));
    getVets().then(r => setVets(r.data.results || r.data));
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
      await createAppointment(form);
      showToast('Запис успішно створено!');
      setModal(false);
      setForm({ animal:'', vet:'', date:'', time:'', description:'' });
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

  if (loading) return <Spinner />;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const filtered = (selectedDate ? appointments.filter(a => a.date === selectedDate) : appointments)
    .filter(a => a.date >= todayStr);
  
  const upcoming = appointments
    .filter(a => ['pending','confirmed'].includes(a.status) && a.date >= todayStr);

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
        <div className="card">
          <div className="card-header">
            <div className="card-title">Календар</div>
            {selectedDate && <button className="btn btn-sm btn-gray" onClick={() => setSelectedDate(null)}>✕ Скинути</button>}
          </div>
          <div className="card-body"><MiniCalendar appointments={appointments} onSelect={setSelectedDate} selected={selectedDate} /></div>
        </div>

        {/* Блок найближчих прийомів */}
        <div>
          <div className="card">
            <div className="card-header"><div className="card-title">Найближчі прийоми</div></div>
            <div className="card-body">
              {upcoming.length === 0 ? <EmptyState icon="" title="Немає запланованих прийомів" />
              : upcoming.map(a => (
                <div key={a.id} className="appointment-block" style={{padding: '16px 20px', marginBottom: 12, border: '1px solid var(--gray-100)', borderRadius: 12}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap: 20}}>
                    <div style={{minWidth: 100}}>
                      <div style={{fontSize: 24, fontWeight: 900, color: 'var(--teal)', lineHeight: 1}}>{a.time?.slice(0,5)}</div>
                      <div style={{fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginTop: 4}}>{a.date}</div>
                    </div>
                    <div style={{flex: 1, borderLeft: '2px solid var(--gray-100)', paddingLeft: 20}}>
                      <div style={{fontSize: 15, fontWeight: 700, marginBottom: 2}}>{a.description || 'Консультація'}</div>
                      <div style={{fontSize: 13, color: 'var(--gray-600)'}}><strong>{a.animal_name}</strong></div>
                      <div style={{marginTop: 6}}><StatusBadge status={a.status} /></div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{fontSize: 14, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 8}}>{a.vet_name}</div>
                      {['pending','confirmed'].includes(a.status) && (
                        <button className="btn btn-red btn-sm" onClick={() => setCancelTarget(a)}>Скасувати</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Таблиця всіх записів */}
      <div className="card mt-4">
        <div className="card-header">
          <div className="card-title">Історія та майбутні записи {selectedDate && `— ${selectedDate}`}</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Дата</th><th>Час</th><th>Тварина</th><th>Лікар</th><th>Опис</th><th>Статус</th><th>Дії</th></tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7} style={{textAlign:'center',padding:20,color:'var(--gray-400)'}}>Записів не знайдено</td></tr>
                : filtered.map(a => (
                  <tr key={a.id}>
                    <td>{a.date}</td>
                    <td>{a.time?.slice(0,5)}{a.end_time ? `–${a.end_time}` : ''}</td>
                    <td>{a.animal_name}</td><td>{a.vet_name}</td>
                    <td>{a.description || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>{['pending','confirmed'].includes(a.status) && (
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
          <label className="form-label">Час * <span style={{fontSize:11,color:'var(--gray-400)',fontWeight:400}}>(08:00–17:00)</span></label>
          {slotsLoading ? <div style={{fontSize:13,color:'var(--gray-400)'}}>Завантаження вільних слотів...</div>
          : (
            <div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                {Array.from({length: 19}, (_, i) => {
                  const h = Math.floor(i / 2) + 8;
                  const m = i % 2 === 0 ? '00' : '30';
                  return `${String(h).padStart(2,'0')}:${m}`;
                }).map(time => {
                  const apiSlot = slots.find(s => s.time.slice(0,5) === time || s.time === time);
                  const isFree = slots.length > 0 ? (apiSlot ? apiSlot.free : false) : true;
                  return (
                    <button key={time} type="button"
                      onClick={() => isFree && set('time', time)}
                      className={`btn btn-sm ${time === form.time ? 'btn-teal' : isFree ? 'btn-outline' : 'btn-gray'}`}
                      disabled={!isFree}
                      style={{opacity: isFree ? 1 : 0.4, cursor: isFree ? 'pointer' : 'not-allowed'}}>
                      {time}{!isFree ? ' ✕' : ''}
                    </button>
                  );
                })}
              </div>
              {form.time && <div style={{fontSize:12,color:'var(--teal)',fontWeight:700}}>✓ Обрано: {form.time}</div>}
            </div>
          )}
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
