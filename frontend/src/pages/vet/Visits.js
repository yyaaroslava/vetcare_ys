import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getVisits, createVisit, updateVisit, deleteVisit } from '../../api/visits';
import { getAnimals } from '../../api/animals';
import { Spinner, Modal, StatusBadge, EmptyState, showToast, ConfirmModal } from '../../components/ui';

/**
 * Журнал медичних візитів для ветеринарного лікаря.
 * Дозволяє переглядати історію, редагувати діагнози та призначення.
 */

const EMPTY = { animal: '', visit_date: '', diagnosis: '', prescription: '', status: 'completed', weight_at_visit: '', temperature: '', notes: '' };

export default function VetVisits() {
  const [visits, setVisits] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [filterAnimal, setFilterAnimal] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Завантаження списку всіх візитів та пацієнтів
  const load = () => {
    Promise.all([getVisits(), getAnimals()]).then(([v, a]) => {
      setVisits(v.data.results || v.data);
      setAnimals(a.data.results || a.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = v => {
    setEditing(v);
    setForm({
      animal: v.animal,
      visit_date: v.visit_date,
      diagnosis: v.diagnosis,
      prescription: v.prescription || '',
      status: v.status,
      weight_at_visit: v.weight_at_visit || '',
      temperature: v.temperature || '',
      notes: v.notes || ''
    });
    setModal(true);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.weight_at_visit) delete data.weight_at_visit;
      if (!data.temperature) delete data.temperature;
      if (editing) await updateVisit(editing.id, data);
      else await createVisit(data);
      showToast(editing ? 'Візит оновлено!' : 'Візит зафіксовано!');
      setModal(false); load();
    } catch (err) {
      showToast(Object.values(err.response?.data || {}).flat().join(' ') || 'Помилка', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await deleteVisit(confirm.id);
    showToast('Видалено'); setConfirm(null); load();
  };

  if (loading) return <Spinner />;

  let filtered = visits;
  if (filterAnimal) filtered = filtered.filter(v => String(v.animal) === filterAnimal);
  if (filterOwner) {
    const ownerPets = animals.filter(a => String(a.owner_id || a.owner) === filterOwner).map(a => a.id);
    filtered = filtered.filter(v => ownerPets.includes(v.animal));
  }
  if (filterStatus) filtered = filtered.filter(v => v.status === filterStatus);
  if (filterDate) filtered = filtered.filter(v => v.visit_date === filterDate);
  if (search) filtered = filtered.filter(v =>
    v.animal_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.diagnosis?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (ds) => {
    if (!ds) return '—';
    const parts = ds.split('-');
    if (parts.length !== 3) return ds;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  filtered.sort((a, b) => {
    const valA = a.visit_date;
    const valB = b.visit_date;
    return sortOrder === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
  });

  const uniqueOwners = Array.from(new Set(animals.map(a => JSON.stringify({ id: a.owner_id || a.owner, name: a.owner_name }))))
    .map(s => JSON.parse(s))
    .filter(o => o.id);

  const displayAnimals = animals.filter(a => !filterOwner || String(a.owner_id || a.owner) === filterOwner);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Журнал візитів</div>
          <div className="page-subtitle">Перегляд медичної історії пацієнтів</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
        <input className="form-input" style={{ flex: 1, maxWidth: 500, fontSize: 16 }}
          placeholder="Швидкий пошук"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ width: 180 }} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
          <option value="desc">Спочатку нові</option>
          <option value="asc">Спочатку старі</option>
        </select>
        {(search || filterAnimal || filterOwner || filterStatus || filterDate) && (
          <button className="btn btn-gray btn-sm" onClick={() => {
            setSearch(''); setFilterAnimal(''); setFilterOwner(''); setFilterStatus(''); setFilterDate('');
          }}>Скинути все</button>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Всі візити</div>
          <span className="badge badge-teal">{filtered.length}</span>
        </div>
        {filtered.length === 0 ? (
          <div className="card-body"><EmptyState title="Записів не знайдено" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead style={{ background: 'var(--teal)', color: '#fff' }}>
                <tr style={{ verticalAlign: 'top' }}>
                  <th style={{ width: 120, padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ДАТА</div>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <input type="date" className="form-input input-xs"
                        value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                    </div>
                  </th>
                  <th style={{ width: 130, padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ЧАС</div>
                    <div style={{ height: 32 }}></div>
                  </th>
                  <th style={{ width: 140, padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ТВАРИНА</div>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <select className="form-select input-xs"
                        value={filterAnimal} onChange={e => setFilterAnimal(e.target.value)}>
                        <option value="">Всі тварини</option>
                        {displayAnimals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </th>
                  <th style={{ width: 140, padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ВЛАСНИК</div>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <select className="form-select input-xs"
                        value={filterOwner} onChange={e => { setFilterOwner(e.target.value); setFilterAnimal(''); }}>
                        <option value="">Всі власники</option>
                        {uniqueOwners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  </th>
                  <th style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ДІАГНОЗ</div>
                    <div style={{ height: 32 }}></div>
                  </th>
                  <th style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ПРИЗНАЧЕННЯ</div>
                    <div style={{ height: 32 }}></div>
                  </th>
                  <th style={{ width: 130, padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>СТАТУС</div>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <select className="form-select input-xs"
                        value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Всі</option>
                        <option value="completed">Виконано</option>
                        <option value="cancelled">Скасовано</option>
                      </select>
                    </div>
                  </th>
                  <th style={{ textAlign: 'center', width: 380, padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ДІЇ</div>
                    <div style={{ height: 32 }}></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td><strong>{formatDate(v.visit_date)}</strong></td>
                    <td style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {v.visit_time && v.visit_end_time ? `${v.visit_time} — ${v.visit_end_time}` : (v.visit_time || '—')}
                    </td>
                    <td>{v.animal_name}</td>
                    <td>{v.owner_name}</td>
                    <td style={{ fontWeight: 600 }}>{v.diagnosis}</td>
                    <td style={{ color: 'var(--gray-600)' }}>{v.prescription || '—'}</td>
                    <td><StatusBadge status={v.status} /></td>
                    <td style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setDetail(v)}>Деталі</button>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(v)}>Редагувати</button>
                      <Link to={`/vet/patients/${v.animal}`} className="btn btn-teal" style={{ padding: '6px 12px', fontSize: '11px', textAlign: 'center', lineHeight: 1.2, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '90px' }}>
                        Медична<br />картка
                      </Link>
                      <button className="btn btn-red btn-sm" onClick={() => setConfirm(v)}>Видалити</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={'Редагувати візит'}
        actions={<>
          <button className="btn btn-gray" onClick={() => setModal(false)}>Скасувати</button>
          <button className="btn btn-teal" onClick={handleSave} disabled={saving || !form.diagnosis}>
            {saving ? '...' : 'Зберегти'}
          </button>
        </>}>
        <div className="form-group">
          <label className="form-label">Діагноз / Опис *</label>
          <textarea className="form-textarea" value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} placeholder="Висновок лікаря..." />
        </div>
        <div className="form-group">
          <label className="form-label">Призначення</label>
          <textarea className="form-textarea" value={form.prescription} onChange={e => set('prescription', e.target.value)} placeholder="Препарати, процедури..." />
        </div>
        <div className="grid-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Вага (кг)</label>
            <input className="form-input" type="number" step="0.1" value={form.weight_at_visit} onChange={e => set('weight_at_visit', e.target.value)} placeholder="15.0" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Температура (°C)</label>
            <input className="form-input" type="number" step="0.1" value={form.temperature} onChange={e => set('temperature', e.target.value)} placeholder="38.5" />
          </div>
        </div>
        <div className="form-group mt-4">
          <label className="form-label">Нотатки</label>
          <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Деталі візиту — ${detail?.animal_name}`}
        actions={<button className="btn btn-gray" onClick={() => setDetail(null)}>Закрити</button>}>
        {detail && (
          <div>
            {[
              ['Дата', formatDate(detail.visit_date)],
              ['Тварина', detail.animal_name],
              ['Власник', detail.owner_name],
              ['Лікар', detail.vet_name],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-500)', fontSize: 14 }}>{l}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{v}</span>
              </div>
            ))}
            {detail.weight_at_visit && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-500)', fontSize: 14 }}>Вага</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{detail.weight_at_visit} кг</span>
              </div>
            )}
            {detail.temperature && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-500)', fontSize: 14 }}>Температура</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{detail.temperature} °C</span>
              </div>
            )}
            <div style={{ marginTop: 16, padding: '14px', background: 'var(--teal-bg)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--teal-dark)', marginBottom: 6, textTransform: 'uppercase' }}>Діагноз</div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>{detail.diagnosis}</div>
            </div>
            {detail.prescription && (
              <div style={{ marginTop: 10, padding: '14px', background: 'var(--gray-50)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray-500)', marginBottom: 6, textTransform: 'uppercase' }}>Призначення</div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{detail.prescription}</div>
              </div>
            )}
            {detail.notes && (
              <div style={{ marginTop: 10, padding: '14px', border: '1px dashed var(--gray-200)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray-400)', marginBottom: 6, textTransform: 'uppercase' }}>Нотатки</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, fontStyle: 'italic' }}>{detail.notes}</div>
              </div>
            )}
            <div style={{ marginTop: 16 }}><StatusBadge status={detail.status} /></div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete}
        title="Видалити візит?" message={`Ви впевнені, що хочете видалити медичний запис для ${confirm?.animal_name} від ${confirm?.visit_date}?`} danger />
    </div>
  );
}
