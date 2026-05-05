import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAnimal, updateAnimal } from '../../api/animals';
import { getVets, getMe, updateMe } from '../../api/auth';
import { getAppointments, cancelAppointment } from '../../api/appointments';
import { Spinner, Modal, StatusBadge, speciesEmoji, showToast, ConfirmModal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

/**
 * Функція форматування віку (роки + місяці) з правильними закінченнями.
 */
function formatAge(birthDateStr) {
  if (!birthDateStr) return '—';
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  
  if (years < 0) return 'Введіть правильну дату';
  if (years === 0 && months === 0) return 'Менше місяця';
  
  if (years === 0) {
    if (months === 1) return '1 місяць';
    if (months >= 2 && months <= 4) return `${months} місяці`;
    return `${months} місяців`;
  }
  
  let yearStr = 'років';
  const lastDigit = years % 10;
  if (years % 100 >= 11 && years % 100 <= 14) yearStr = 'років';
  else if (lastDigit === 1) yearStr = 'рік';
  else if (lastDigit >= 2 && lastDigit <= 4) yearStr = 'роки';
  
  if (months === 0) return `${years} ${yearStr}`;
  
  let monthStr = 'місяців';
  if (months === 1) monthStr = 'місяць';
  else if (months >= 2 && months <= 4) monthStr = 'місяці';
  
  return `${years} ${yearStr} ${months} ${monthStr}`;
}

/**
 * Компонент медичної картки тварини (клієнтська частина).
 */
export default function ClientMedCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isVet = user?.role === 'doctor'; // В нашій базі роль лікаря — 'doctor'
  const rolePrefix = isVet ? '/vet' : '/client';

  const [animal, setAnimal] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [vets, setVets] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editAnimal, setEditAnimal] = useState(null);
  const [editOwner, setEditOwner] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  // Опції видів тварин
  const SPECIES_OPTIONS = [
    { value: 'dog', label: 'Собака' },
    { value: 'cat', label: 'Кіт' },
    { value: 'bird', label: 'Птах' },
    { value: 'rabbit', label: 'Кролик' },
    { value: 'other', label: 'Інше' },
  ];

  /**
   * Завантаження всіх необхідних даних для картки.
   */
  const loadData = () => {
    Promise.all([
      getAnimal(id),
      getAppointments({ animal: id }),
      getVets(),
      getMe()
    ]).then(([a, aps, vts, me]) => {
      setAnimal(a.data);
      setAppointments(aps.data.results || aps.data);
      setVets(vts.data.results || vts.data);
      setUserProfile(me.data);
    })
    .catch(err => {
      console.error(err);
      showToast('Помилка при завантаженні даних', 'error');
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);

  const setA = (k, v) => setEditAnimal(f => ({ ...f, [k]: v }));
  const setO = (k, v) => setEditOwner(f => ({ ...f, [k]: v }));

  // Оновлення медичних даних тварини (діагнози, вага, алергії)
  const handleSaveAnimal = async () => {
    setSaving(true);
    try {
      const data = { ...editAnimal };
      if (data.species === 'other' && data.custom_species) {
        data.other_species = data.custom_species;
      } else {
        data.other_species = '';
      }
      delete data.custom_species;
      
      await updateAnimal(animal.id, data);
      showToast('Дані оновлено');
      setEditAnimal(null);
      loadData();
    } catch (err) {
      showToast('Помилка при збереженні', 'error');
    } finally { setSaving(false); }
  };

  // Оновлення персональних даних власника (ПІБ, телефон)
  const handleSaveOwner = async () => {
    setSaving(true);
    try {
      await updateMe(editOwner);
      showToast('Профіль оновлено');
      setEditOwner(null);
      loadData();
    } catch (err) {
      showToast('Помилка при збереженні', 'error');
    } finally { setSaving(false); }
  };

  /**
   * Скасування запису на прийом.
   */
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
  if (!animal) return <div className="p-8 text-center">Тварину не знайдено</div>;

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = appointments
    .filter(a => ['pending','confirmed'].includes(a.status) && a.date >= todayStr)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  return (
    <div className="page-container">
      <div className="page-header" style={{justifyContent: 'flex-start', gap: 20}}>
        <div style={{flex: 1}}>
          <div className="page-title">Медична картка</div>
          <div className="page-subtitle">{animal.name} — {animal.species_display}</div>
        </div>
        <div style={{display:'flex', gap:10}}>
          {!isVet && (
            <button 
              className="btn btn-teal" 
              onClick={() => navigate('/client/appointments', { state: { animalId: animal.id } })}
            >
              + Записатися на прийом
            </button>
          )}
          <button className="btn btn-outline" onClick={() => navigate(-1)}>← Назад</button>
        </div>
      </div>

      <div className="medcard-layout" style={{display: 'flex', gap: 24, alignItems: 'flex-start'}}>
        {/* Ліва колонка: Профіль */}
        <div style={{width: 380, flexShrink: 0}}>
          <div className="card mb-4" style={{padding: 24}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom: 20}}>
              <div className="card-title" style={{fontSize: 18}}>Пацієнт</div>
              <button className="btn btn-outline btn-sm" onClick={() => setEditAnimal({...animal, custom_species: animal.species === 'other' ? animal.other_species : ''})}>Редагувати</button>
            </div>
            
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              {[
                ['Кличка', animal.name],
                ['Вид', animal.species_display],
                ['Порода', animal.breed || '—'],
                ['Вік', formatAge(animal.birth_date)],
                ['Вага', animal.weight ? `${animal.weight} кг` : '—'],
                ['Алергії', animal.allergies || 'Немає'],
                ['Хронічні захворювання', animal.chronic_diseases || 'Немає']
              ].map(([l, v]) => (
                <div key={l} style={{display:'flex', justifyContent:'space-between', borderBottom: '1px solid var(--gray-100)', paddingBottom: 8}}>
                  <span style={{color: 'var(--gray-500)', fontSize: 14}}>{l}</span>
                  <span style={{fontWeight: 700, color: 'var(--gray-800)', fontSize: 14, textAlign: 'right', maxWidth: '60%'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{padding: 24}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom: 20}}>
              <div className="card-title" style={{fontSize: 18}}>Власник</div>
              {!isVet && <button className="btn btn-outline btn-sm" onClick={() => setEditOwner({...userProfile})}>Редагувати</button>}
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              {[
                ['ПІБ', animal.owner_name],
                ['Телефон', animal.owner_phone || '—'],
                ['Email', animal.owner_email || '—']
              ].map(([l, v]) => (
                <div key={l} style={{display:'flex', justifyContent:'space-between', borderBottom: '1px solid var(--gray-100)', paddingBottom: 8}}>
                  <span style={{color: 'var(--gray-500)', fontSize: 14}}>{l}</span>
                  <span style={{fontWeight: 700, color: 'var(--gray-800)', fontSize: 14}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Права колонка: Найближчі прийоми */}
        <div style={{flex: 1}}>
          <div className="card" style={{border: '1px solid var(--teal-bg)', background: 'var(--teal-bg-light)'}}>
            <div className="card-header">
              <div className="card-title">Найближчі прийоми</div>
              <span className="badge badge-teal">{upcoming.length}</span>
            </div>
            <div className="card-body" style={{padding: '10px 20px 20px'}}>
              {upcoming.length === 0 ? (
                <div style={{textAlign:'center', padding:'30px 0', color:'var(--gray-500)', fontSize:14}}>
                  У цієї тварини немає запланованих прийомів
                </div>
              ) : upcoming.map(a => (
                <div key={a.id} className="appointment-block" style={{marginTop: 12, background: 'white', borderRadius: 12, border: '1px solid var(--teal-bg)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '14px 18px'}}>
                    <div style={{display:'flex', gap: 16, alignItems:'center'}}>
                      <div style={{textAlign: 'center', minWidth: 60}}>
                        <div style={{fontSize: 20, fontWeight: 900, color: 'var(--teal)', lineHeight: 1}}>{a.time?.slice(0,5)}</div>
                        <div style={{fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', marginTop: 2}}>{a.date}</div>
                      </div>
                      <div style={{borderLeft: '2px solid var(--gray-100)', paddingLeft: 16}}>
                        <div style={{fontSize: 14, fontWeight: 700}}>{a.description || 'Прийом'}</div>
                        <div style={{marginTop: 4}}><StatusBadge status={a.status} /></div>
                      </div>
                    </div>
                    {!isVet && <button className="btn btn-red btn-sm" onClick={() => setCancelTarget(a)}>Скасувати</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Модальні вікна (редагування) */}
      <Modal open={!!editAnimal} onClose={() => setEditAnimal(null)} title="Редагувати тварину"
        actions={<><button className="btn btn-gray" onClick={() => setEditAnimal(null)}>Скасувати</button><button className="btn btn-teal" onClick={handleSaveAnimal} disabled={saving}>Зберегти</button></>}>
        {editAnimal && (
          <div style={{display:'flex', flexDirection:'column', gap: 12}}>
            <div className="form-group">
              <label className="form-label">Кличка</label>
              <input className="form-input" value={editAnimal.name} onChange={e=>setA('name', e.target.value)} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Вид</label>
                <select className="form-select" value={editAnimal.species} onChange={e=>setA('species', e.target.value)}>
                  {SPECIES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Дата народження</label>
                <input className="form-input" type="date" value={editAnimal.birth_date || ''} onChange={e=>setA('birth_date', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Алергії</label>
              <textarea className="form-textarea" value={editAnimal.allergies || ''} onChange={e=>setA('allergies', e.target.value)} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label">Хронічні захворювання</label>
              <textarea className="form-textarea" value={editAnimal.chronic_diseases || ''} onChange={e=>setA('chronic_diseases', e.target.value)} rows={2} />
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editOwner} onClose={() => setEditOwner(null)} title="Редагувати власника"
        actions={<><button className="btn btn-gray" onClick={() => setEditOwner(null)}>Скасувати</button><button className="btn btn-teal" onClick={handleSaveOwner} disabled={saving}>Зберегти</button></>}>
        {editOwner && (
          <div style={{display:'flex', flexDirection:'column', gap: 12}}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Ім'я</label>
                <input className="form-input" value={editOwner.first_name} onChange={e=>setO('first_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Прізвище</label>
                <input className="form-input" value={editOwner.last_name} onChange={e=>setO('last_name', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Телефон *</label>
              <input className="form-input" value={editOwner.phone} onChange={e=>setO('phone', e.target.value)} placeholder="+380..." />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={editOwner.email} disabled />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        title="Скасувати запис?" message={`Ви дійсно хочете скасувати прийом на ${cancelTarget?.date} о ${cancelTarget?.time?.slice(0,5)}?`} danger />
    </div>
  );
}