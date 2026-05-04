import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnimals, updateAnimal } from '../../api/animals';
import { Spinner, Modal, EmptyState, showToast } from '../../components/ui';

/**
 * Сторінка списку пацієнтів для ветеринара
 * Дозволяє переглядати всіх тварин клініки та додавати клінічні нотатки
 */
export default function VetPatients() {
  const navigate = useNavigate();
  const [animals, setAnimals] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => getAnimals().then(r => setAnimals(r.data.results || r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openEdit = a => {
    setEditing(a);
    setForm({ notes: a.notes||'', chronic_diseases: a.chronic_diseases||'', allergies: a.allergies||'', weight: a.weight||'', breed: a.breed||'', color: a.color||'' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAnimal(editing.id, form);
      showToast('Картку оновлено!');
      setEditing(null); load();
    } catch { showToast('Помилка', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner />;

  const filtered = search
    ? animals.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.breed?.toLowerCase().includes(search.toLowerCase()) ||
        a.species_display?.toLowerCase().includes(search.toLowerCase())
      )
    : animals;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Пацієнти</div>
          <div className="page-subtitle">Медичні картки тварин</div>
        </div>
        {/* Пошук без іконок */}
        <input 
          className="form-input" 
          style={{width:280}} 
          placeholder="Пошук за кличкою, власником, породою..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Всі пацієнти</div>
          <span className="badge badge-blue">{filtered.length}</span>
        </div>
        {filtered.length === 0
          ? <div className="card-body"><EmptyState title="Пацієнтів не знайдено" /></div>
          : <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Тварина</th>
                  <th>Власник</th>
                  <th>Стан здоров'я</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <div>
                          <div style={{fontWeight:800, color:'var(--gray-900)'}}>{a.name}</div>
                          <div style={{fontSize:11, color:'var(--gray-500)', fontWeight:600}}>{a.breed || 'Без породи'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{fontWeight:600, color:'var(--gray-700)'}}>{a.owner_name}</div>
                      <div style={{fontSize:11, color:'var(--gray-400)'}}>Власник</div>
                    </td>
                    <td>
                      <div style={{display:'flex', flexDirection:'column', gap:4}}>
                        {a.allergies ? <span className="badge badge-red" style={{width:'fit-content'}}>Алергія: {a.allergies}</span> : null}
                        {a.chronic_diseases ? <span className="badge badge-orange" style={{width:'fit-content'}}>Хронічні хвороби: {a.chronic_diseases.slice(0,25)}{a.chronic_diseases.length > 25 ? '...' : ''}</span> : null}
                        {!a.allergies && !a.chronic_diseases && <span className="badge badge-green" style={{width:'fit-content'}}>Здоровий(а)</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/vet/patients/${a.id}`)}>Картка</button>
                        <button className="btn btn-teal btn-sm" onClick={() => openEdit(a)}>Нотатки</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </div>

      {/* Модальне вікно для нотаток лікаря — залишаємо лише поле Нотатки */}
      <Modal 
        open={!!editing} 
        onClose={() => setEditing(null)} 
        title={`Нотатки лікаря: ${editing?.name}`}
        actions={<>
          <button className="btn btn-gray" onClick={() => setEditing(null)}>Скасувати</button>
          <button className="btn btn-teal" onClick={handleSave} disabled={saving}>{saving ? '...' : 'Зберегти'}</button>
        </>}>
        <div style={{padding:'10px 12px', background:'var(--teal-bg)', borderRadius:8, fontSize:13, color:'var(--gray-600)', marginBottom:16}}>
          Тільки ветеринарний лікар може додавати клінічні нотатки до картки тварини
        </div>
        <div className="form-group">
          <label className="form-label">Нотатки лікаря</label>
          <textarea 
            className="form-textarea" 
            rows={6} 
            value={form.notes} 
            onChange={e => setForm(f => ({...f, notes: e.target.value}))} 
            placeholder="Клінічні спостереження, рекомендації..." 
          />
        </div>
      </Modal>
    </div>
  );
}
