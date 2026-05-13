import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnimals, createAnimal, updateAnimal, deleteAnimal } from '../../api/animals';
import { getVets } from '../../api/auth';
import { Spinner, Modal, EmptyState, showToast, ConfirmModal } from '../../components/ui';
import { extractData } from '../../utils/formatters';

// Опції для вибору виду тварини
const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Собака' },
  { value: 'cat', label: 'Кіт' },
  { value: 'bird', label: 'Птах' },
  { value: 'rabbit', label: 'Кролик' },
  { value: 'other', label: 'Інше' },
];

// Початковий стан форми для нової тварини
const EMPTY = { name:'', species:'dog', custom_species:'', breed:'', gender:'', birth_date:'', weight:'', color:'', allergies:'', chronic_diseases:'', notes:'', vet:'' };

/**
 * Компонент сторінки списку тварин клієнта
 */
export default function ClientPets() {
  const [animals, setAnimals] = useState([]);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Функція завантаження списку тварин з сервера
  const load = () => getAnimals().then(r => setAnimals(extractData(r))).finally(() => setLoading(false));
  
  // Завантаження даних при ініціалізації компонента
  useEffect(() => { 
    load(); 
    getVets().then(r => setVets(extractData(r))); 
    
    // Перевірка action=new у параметрах URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setModal(true);
      // Очищуємо параметр з URL без перезавантаження
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Відкриття модального вікна для додавання нової тварини
  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  
  // Відкриття модального вікна для редагування існуючої тварини
  const openEdit = (e, a) => {
    e.stopPropagation();
    setEditing(a);
    setForm({ ...EMPTY, ...a, birth_date: a.birth_date||'', weight: a.weight||'', vet: a.vet||'', custom_species: a.species === 'other' ? a.other_species || '' : '' });
    setModal(true);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /**
   * Збереження даних (створення або оновлення)
   */
  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form };
      // Обробка поля "Інший вид"
      if (data.species === 'other' && data.custom_species) {
        data.other_species = data.custom_species;
      } else {
        data.other_species = '';
      }
      delete data.custom_species;
      
      // Видалення порожніх полів перед відправкою
      if (!data.weight) delete data.weight;
      if (!data.birth_date) delete data.birth_date;
      if (!data.vet) delete data.vet;
      
      if (editing) await updateAnimal(editing.id, data);
      else await createAnimal(data);
      
      showToast(editing ? 'Картку оновлено!' : 'Тварину додано!');
      setModal(false); 
      load();
    } catch (err) {
      showToast(Object.values(err.response?.data || {}).flat().join(' ') || 'Помилка', 'error');
    } finally { setSaving(false); }
  };

  /**
   * Видалення тварини (деактивація на сервері)
   */
  const handleDelete = async () => {
    await deleteAnimal(confirm.id);
    showToast('Тварину видалено');
    setConfirm(null); 
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Мої тварини</div>
          <div className="page-subtitle">Профілі ваших улюбленців</div>
        </div>
        <button className="btn btn-teal" style={{padding:'12px 24px', fontSize:15, fontWeight:800, borderRadius:12}} onClick={openAdd}>+ Додати тварину</button>
      </div>

      {/* Перевірка наявності тварин у списку */}
      {animals.length === 0 ? (
        <EmptyState icon="" title="Тварин ще немає" subtitle="Додайте вашого першого улюбленця"
          action={<button className="btn btn-teal" onClick={openAdd}>+ Додати тварину</button>} />
      ) : (
        <div className="pet-grid">
          {animals.map(a => (
            <div key={a.id} className="pet-card" onClick={() => navigate(`/client/pets/${a.id}`)} style={{position: 'relative'}}>
              {/* Кнопки дій на картці */}
              <div style={{position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6}}>
                <button title="Редагувати" style={{background: 'white', border: '1px solid var(--gray-200)', borderRadius: 6, padding: '4px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: 13}} onClick={e => openEdit(e, a)}>Редагувати</button>
                <button title="Видалити" style={{background: 'white', border: '1px solid var(--gray-200)', borderRadius: 6, padding: '4px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: 13, color: 'var(--red)'}} onClick={e => { e.stopPropagation(); setConfirm(a); }}>Видалити</button>
              </div>

              <div className="pet-card-body" style={{textAlign:'center', display:'flex', flexDirection:'column', padding: '40px 28px', minHeight: 180}}>
                <div className="pet-card-name" style={{fontSize: 26, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 28}}>{a.name}</div>
                
                <div style={{marginTop:'auto'}}>
                  <button className="btn btn-teal w-full" style={{justifyContent:'center', borderRadius:12, padding:'12px', fontSize: 15, fontWeight: 700}}
                    onClick={e => { e.stopPropagation(); navigate(`/client/pets/${a.id}`); }}>
                    Медична картка
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальне вікно створення/редагування */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Редагувати тварину' : 'Додати тварину'}
        actions={<>
          <button className="btn btn-gray" onClick={() => setModal(false)}>Скасувати</button>
          <button className="btn btn-teal" onClick={handleSave} disabled={saving || form.weight < 0}>{saving ? '...' : 'Зберегти'}</button>
        </>}>
        <div className="grid-2">
          <div className="form-group" style={{marginBottom:0}}>
            <label className="form-label">Кличка *</label>
            <input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Рекс" required />
          </div>
          <div className="form-group" style={{marginBottom:0}}>
            <label className="form-label">Вид *</label>
            <select className="form-select" value={form.species} onChange={e=>set('species',e.target.value)}>
              {SPECIES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        {form.species === 'other' && (
          <div className="form-group mt-4">
            <label className="form-label">Вкажіть вид (якщо немає у списку)</label>
            <input className="form-input" value={form.custom_species} onChange={e=>set('custom_species',e.target.value)} placeholder="Наприклад: черепаха, хом'як..." />
          </div>
        )}
        <div className="form-group mt-4">
          <label className="form-label">Порода</label>
          <input className="form-input" value={form.breed} onChange={e=>set('breed',e.target.value)} placeholder="Лабрадор Ретривер" />
        </div>
        <div className="grid-2">
          <div className="form-group" style={{marginBottom:0}}>
            <label className="form-label">Стать</label>
            <select className="form-select" value={form.gender} onChange={e=>set('gender',e.target.value)}>
              <option value="">— Не вказано —</option>
              <option value="male">Самець</option>
              <option value="female">Самиця</option>
            </select>
          </div>
          <div className="form-group" style={{marginBottom:0}}>
            <label className="form-label">Дата народження</label>
            <input 
              className="form-input" 
              type="date" 
              value={form.birth_date} 
              onChange={e=>set('birth_date',e.target.value)} 
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
        <div className="grid-2 mt-4">
          <div className="form-group" style={{marginBottom:0}}>
            <label className="form-label">Вага (кг)</label>
            <input 
              className="form-input" 
              type="number" 
              step="0.1" 
              min="0"
              value={form.weight} 
              onChange={e=>set('weight',e.target.value)} 
              placeholder="15" 
              style={{ borderColor: form.weight < 0 ? 'var(--red)' : undefined }}
            />
            {form.weight < 0 && <div style={{color:'var(--red)', fontSize:12, marginTop:4}}>Вага не може бути від'ємною</div>}
          </div>
          <div className="form-group" style={{marginBottom:0}}>
            <label className="form-label">Колір</label>
            <input className="form-input" value={form.color} onChange={e=>set('color',e.target.value)} placeholder="Золотистий" />
          </div>
        </div>
        <div className="form-group mt-4">
          <label className="form-label">Алергії</label>
          <input className="form-input" value={form.allergies} onChange={e=>set('allergies',e.target.value)} placeholder="Пеніцилін..." />
        </div>
        <div className="form-group mt-4">
          <label className="form-label">Хронічні захворювання</label>
          <input className="form-input" value={form.chronic_diseases} onChange={e=>set('chronic_diseases',e.target.value)} placeholder="Наприклад: астма..." />
        </div>
        <div className="form-group">
          <label className="form-label">Лікуючий лікар</label>
          <select className="form-select" value={form.vet||''} onChange={e=>set('vet',e.target.value||null)}>
            <option value="">— Не призначено —</option>
            {vets.map(v => <option key={v.id} value={v.id}>{v.first_name} {v.last_name}</option>)}
          </select>
        </div>
      </Modal>

      {/* Підтвердження видалення */}
      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete}
        title="Видалити тварину?" message={`Видалити ${confirm?.name}?`} danger />
    </div>
  );
}
