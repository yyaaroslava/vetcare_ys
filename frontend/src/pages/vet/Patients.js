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
  const [filterOwner, setFilterOwner] = useState('');
  const [filterAnimal, setFilterAnimal] = useState('');

  const load = () => getAnimals().then(r => setAnimals(r.data.results || r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openEdit = a => {
    setEditing(a);
    setForm({ notes: a.notes || '', chronic_diseases: a.chronic_diseases || '', allergies: a.allergies || '', weight: a.weight || '', breed: a.breed || '', color: a.color || '' });
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

  /**
   * Логіка фільтрації списку тварин.
   * Пошук ведеться за кличкою, власником, породою або видом тварини.
   */
  let filtered = [...animals];
  if (filterOwner) filtered = filtered.filter(a => String(a.owner) === filterOwner);
  if (filterAnimal) filtered = filtered.filter(a => String(a.id) === filterAnimal);
  if (search) {
    filtered = filtered.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.breed?.toLowerCase().includes(search.toLowerCase()) ||
      a.species_display?.toLowerCase().includes(search.toLowerCase())
    );
  }

  const uniqueOwners = Array.from(new Set(animals.map(a => JSON.stringify({ id: a.owner, name: a.owner_name }))))
    .map(s => JSON.parse(s))
    .filter(o => o.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  const displayAnimals = animals.filter(a => !filterOwner || String(a.owner) === filterOwner);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Пацієнти</div>
          <div className="page-subtitle">Медичні картки всіх тварин клініки</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ flex: 1, maxWidth: 500, fontSize: 16 }}
          placeholder="Швидкий пошук"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {(search || filterOwner || filterAnimal) && (
          <button className="btn btn-gray btn-sm" onClick={() => { setSearch(''); setFilterOwner(''); setFilterAnimal(''); }}>
            Скинути все
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Всі пацієнти</div>
          <span className="badge badge-teal">{filtered.length}</span>
        </div>
        {filtered.length === 0
          ? <div className="card-body"><EmptyState title="Пацієнтів не знайдено" /></div>
          : <div className="table-wrap">
            <table>
              <thead style={{ background: 'var(--teal)', color: '#fff' }}>
                <tr style={{ verticalAlign: 'top' }}>
                  <th style={{ width: '15%', padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ПАЦІЄНТ</div>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <select className="form-select input-xs"
                        value={filterAnimal} onChange={e => setFilterAnimal(e.target.value)}>
                        <option value="">Всі тварини</option>
                        {displayAnimals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </th>
                  <th style={{ width: '15%', padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ВЛАСНИК</div>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <select className="form-select input-xs"
                        value={filterOwner} onChange={e => { setFilterOwner(e.target.value); setFilterAnimal(''); }}>
                        <option value="">Всі власники</option>
                        {uniqueOwners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  </th>
                  <th style={{ width: '18%', padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>СТАН ЗДОРОВ'Я</div>
                    <div style={{ height: 32 }}></div>
                  </th>
                  <th style={{ width: '37%', padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>НОТАТКИ ЛІКАРЯ</div>
                    <div style={{ height: 32 }}></div>
                  </th>
                  <th style={{ textAlign: 'center', width: '15%', padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ДІЇ</div>
                    <div style={{ height: 32 }}></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--gray-900)' }}>{a.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{a.species_display} · {a.breed || 'Без породи'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: 13 }}>{a.owner_name}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {a.allergies ? (
                          <span className="badge badge-red" style={{ fontSize: 11, padding: '2px 8px', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.allergies}>
                            Алергія: {a.allergies}
                          </span>
                        ) : null}
                        {a.chronic_diseases ? (
                          <span className="badge badge-orange" style={{ fontSize: 11, padding: '2px 8px', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.chronic_diseases}>
                            Хвороби: {a.chronic_diseases}
                          </span>
                        ) : null}
                        {!a.allergies && !a.chronic_diseases && <span className="badge badge-green" style={{ fontSize: 11, padding: '2px 8px', width: 'fit-content' }}>Здоровий(а)</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.notes}>
                        {a.notes || <span style={{ color: 'var(--gray-300)' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button className="btn btn-teal" style={{ padding: '6px 12px', fontSize: '11px', textAlign: 'center', lineHeight: 1.2, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '90px' }} onClick={() => navigate(`/vet/patients/${a.id}`)}>
                          Медична<br />картка
                        </button>
                        <button className="btn btn-teal btn-sm" style={{ height: '42px' }} onClick={() => openEdit(a)}>Нотатки</button>
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
        <div className="form-group">
          <label className="form-label">Нотатки лікаря</label>
          <textarea
            className="form-textarea"
            rows={6}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Клінічні спостереження, рекомендації..."
          />
        </div>
      </Modal>
    </div>
  );
}
