import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { updateAnimal, getAnimal } from '../../api/animals';
import { getVets, getMe, updateMe } from '../../api/auth';
import { Spinner, Modal, showToast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

// Варіанти видів тварин для вибору
const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Собака' },
  { value: 'cat', label: 'Кіт' },
  { value: 'bird', label: 'Птах' },
  { value: 'rabbit', label: 'Кролик' },
  { value: 'other', label: 'Інше' },
];

/**
 * Розрахунок віку на основі дати народження.
 * Повертає вік у форматі "X років Y місяців".
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
  
  const getYearStr = (y) => {
    const lastDigit = y % 10;
    if (y % 100 >= 11 && y % 100 <= 14) return 'років';
    if (lastDigit === 1) return 'рік';
    if (lastDigit >= 2 && lastDigit <= 4) return 'роки';
    return 'років';
  };

  const getMonthStr = (m) => {
    if (m === 1) return 'місяць';
    if (m >= 2 && m <= 4) return 'місяці';
    return 'місяців';
  };

  if (years === 0 && months === 0) return 'Менше місяця';
  if (years === 0) return `${months} ${getMonthStr(months)}`;
  if (months === 0) return `${years} ${getYearStr(years)}`;
  
  return `${years} ${getYearStr(years)} ${months} ${getMonthStr(months)}`;
}

/**
 * Сторінка медичної картки тварини для клієнта
 */
export default function ClientMedCard() {
  const { id } = useParams();
  const { user } = useAuth();
  const isVet = user?.role === 'doctor';
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vets, setVets] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  
  const [editAnimal, setEditAnimal] = useState(null);
  const [editOwner, setEditOwner] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Завантаження даних про тварину та профіль власника
  const loadData = () => {
    setLoading(true);
    Promise.all([
      getAnimal(id), 
      getVets(), 
      getMe()
    ])
      .then(([a, vts, me]) => {
        setAnimal(a.data);
        setVets(vts.data.results || vts.data);
        setUserProfile(me.data);
      })
      .catch(() => showToast('Помилка завантаження даних', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);

  const setA = (k, v) => setEditAnimal(f => ({ ...f, [k]: v }));
  const setO = (k, v) => setEditOwner(f => ({ ...f, [k]: v }));

  // Оновлення даних тварини через API
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
      if (data.weight === '') data.weight = null;
      
      await updateAnimal(animal.id, data);
      showToast('Дані тварини оновлено!');
      setEditAnimal(null); 
      loadData();
    } catch (err) {
      showToast('Помилка при збереженні тварини', 'error');
    } finally { setSaving(false); }
  };

  // Оновлення профілю власника через API
  const handleSaveOwner = async () => {
    setSaving(true);
    try {
      const data = { ...editOwner };
      if (!data.password) delete data.password;
      await updateMe(data);
      showToast('Дані власника оновлено!');
      setEditOwner(null); 
      loadData();
    } catch (err) {
      showToast('Помилка при збереженні власника', 'error');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loader-container"><Spinner /></div>;
  if (!animal) return <div className="loader-container">Тварину не знайдено</div>;

  return (
    <div className="page-container">
      {/* Заголовок сторінки з основними даними */}
      <div className="page-header">
        <div>
          <div className="page-title">Медична картка</div>
          <div className="page-subtitle">{animal.name} — {animal.species_display}{animal.breed ? ` · ${animal.breed}` : ''}</div>
        </div>
        <div style={{display:'flex', gap:10}}>
          {!isVet && <button className="btn btn-teal">+ Записатися на прийом</button>}
          <button className="btn btn-outline" onClick={() => window.history.back()}>← Назад</button>
        </div>
      </div>

      <div style={{display:'flex', justifyContent:'flex-start'}}>
        <div style={{maxWidth: 350, width: '100%'}}>
          {/* Блок з інформацією про Пацієнта */}
          <div className="card" style={{padding: '30px 24px', marginBottom: 16}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <div className="card-title" style={{fontSize:16}}>Пацієнт</div>
              <button className="btn btn-outline btn-sm" style={{padding: '4px 12px', borderRadius: 6}} onClick={() => setEditAnimal({ ...animal, birth_date: animal.birth_date||'', weight: animal.weight||'', vet: animal.vet||'', allergies: animal.allergies||'', chronic_diseases: animal.chronic_diseases||'', custom_species: animal.species === 'other' ? animal.other_species || '' : '' })}>Редагувати</button>
            </div>
            
            <div style={{marginBottom:28}}>
              <div className="pet-name-lg" style={{textAlign:'left', fontSize:26, marginBottom: 4, fontWeight: 800}}>{animal.name}</div>
              <div className="pet-breed-lg" style={{textAlign:'left', fontSize:14, color: 'var(--gray-500)'}}>{animal.species_display} · {animal.breed || 'Без породи'}</div>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:12, marginBottom: animal.notes ? 24 : 0}}>
              {[
                ['Вага', animal.weight ? `${animal.weight} кг` : '—'],
                ['Вік', formatAge(animal.birth_date)],
                ['Дата народження', animal.birth_date || '—'],
                ['Стать', animal.gender === 'male' ? 'Самець' : animal.gender === 'female' ? 'Самиця' : '—'],
                ['Алергії', animal.allergies || 'Відсутні'],
                ['Хронічні хвороби', animal.chronic_diseases || 'Немає відомостей']
              ].map(([l, v], i) => (
                <div key={l} style={{display:'flex', justifyContent:'space-between', fontSize:14, paddingBottom: i !== 5 ? 8 : 0, borderBottom: i !== 5 ? '1px solid var(--gray-100)' : 'none'}}>
                  <span style={{color:'var(--gray-500)'}}>{l}</span>
                  <span style={{fontWeight:600, color: (l === 'Алергії' && animal.allergies) ? 'var(--red)' : 'var(--gray-800)', textAlign:'right', maxWidth:'60%'}}>{v}</span>
                </div>
              ))}
            </div>

            {/* Відображення медичних нотаток від лікаря */}
            {animal.notes && (
              <div style={{padding:'12px', background:'var(--teal-bg)', borderRadius:10, marginTop:4}}>
                <div style={{fontSize:10, fontWeight:800, color:'var(--teal)', marginBottom:4, textTransform:'uppercase'}}>Нотатки лікаря</div>
                <div style={{fontSize:13, color:'var(--gray-600)', lineHeight:1.4}}>{animal.notes}</div>
              </div>
            )}
          </div>

          {/* Блок з інформацією про Власника */}
          <div className="card" style={{padding: '24px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
              <div className="card-title" style={{fontSize:16}}>Власник</div>
              {!isVet && <button className="btn btn-outline btn-sm" style={{padding: '4px 12px', borderRadius: 6}} onClick={() => setEditOwner({ first_name: userProfile?.first_name||'', last_name: userProfile?.last_name||'', phone: userProfile?.phone||'', email: userProfile?.email||'', password: '' })}>Редагувати</button>}
            </div>
            <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:20}}>
              {/* Аватар з ініціалом імені власника */}
              <div style={{width:36, height:36, borderRadius:50, background:'var(--teal)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800}}>
                {animal.owner_name?.slice(0,1)}
              </div>
              <div style={{fontWeight:800, color:'var(--gray-800)', fontSize:15}}>{animal.owner_name}</div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:14, paddingBottom: 8, borderBottom: '1px solid var(--gray-100)'}}>
                <span style={{color:'var(--gray-500)'}}>Телефон</span>
                <span style={{fontWeight:600, color:'var(--gray-800)'}}>{animal.owner_phone || '—'}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:14}}>
                <span style={{color:'var(--gray-500)'}}>Email</span>
                <span style={{fontWeight:600, color:'var(--gray-800)'}}>{animal.owner_email || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно для редагування картки тварини */}
      <Modal open={!!editAnimal} onClose={() => setEditAnimal(null)} title="Редагувати тварину"
        actions={<><button className="btn btn-gray" onClick={() => setEditAnimal(null)}>Скасувати</button><button className="btn btn-teal" onClick={() => {
          if (/\d/.test(editAnimal.name)) return showToast('Ім’я не може містити цифри', 'error');
          handleSaveAnimal();
        }} disabled={saving}>Зберегти</button></>}>
        {editAnimal && (
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Кличка *</label><input className="form-input" value={editAnimal.name} onChange={e=>setA('name',e.target.value)} /></div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Вид *</label>
              <select className="form-select" value={editAnimal.species} onChange={e=>setA('species',e.target.value)}>
                {SPECIES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Порода</label><input className="form-input" value={editAnimal.breed} onChange={e=>setA('breed',e.target.value)} /></div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Дата народження</label><input className="form-input" type="date" value={editAnimal.birth_date} onChange={e=>setA('birth_date',e.target.value)} /></div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Вага (кг)</label><input className="form-input" type="number" step="0.1" value={editAnimal.weight} onChange={e=>setA('weight',e.target.value)} /></div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Стать</label>
              <select className="form-select" value={editAnimal.gender} onChange={e=>setA('gender',e.target.value)}>
                <option value="">— Не вказано —</option>
                <option value="male">Самець</option>
                <option value="female">Самиця</option>
              </select>
            </div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Алергії</label><input className="form-input" value={editAnimal.allergies} onChange={e=>setA('allergies',e.target.value)} /></div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Хронічні захворювання</label><input className="form-input" value={editAnimal.chronic_diseases} onChange={e=>setA('chronic_diseases',e.target.value)} /></div>
          </div>
        )}
      </Modal>

      {/* Модальне вікно для редагування профілю користувача */}
      <Modal open={!!editOwner} onClose={() => setEditOwner(null)} title="Редагувати профіль власника"
        actions={<><button className="btn btn-gray" onClick={() => setEditOwner(null)}>Скасувати</button><button className="btn btn-teal" onClick={() => {
          if (/\d/.test(editOwner.first_name) || /\d/.test(editOwner.last_name)) return showToast('Ім’я та прізвище не можуть містити цифри', 'error');
          handleSaveOwner();
        }} disabled={saving}>Зберегти</button></>}>
        {editOwner && (
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Ім'я</label><input className="form-input" value={editOwner.first_name} onChange={e=>setO('first_name',e.target.value)} /></div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Прізвище</label><input className="form-input" value={editOwner.last_name} onChange={e=>setO('last_name',e.target.value)} /></div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Email</label><input className="form-input" value={editOwner.email} onChange={e=>setO('email',e.target.value)} /></div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Телефон</label><input className="form-input" value={editOwner.phone} onChange={e=>setO('phone',e.target.value)} /></div>
            <div className="form-group" style={{marginBottom:0}}><label className="form-label">Новий пароль (необов'язково)</label><input className="form-input" type="password" value={editOwner.password} onChange={e=>setO('password',e.target.value)} placeholder="••••••••" /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}