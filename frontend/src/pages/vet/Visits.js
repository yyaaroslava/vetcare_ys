import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getVisits, createVisit, updateVisit, deleteVisit } from '../../api/visits';
import { getAnimals } from '../../api/animals';
import { Spinner, Modal, StatusBadge, EmptyState, showToast, ConfirmModal, SearchBar } from '../../components/ui';
import { formatDate, extractData } from '../../utils/formatters';
import VaccinationModal from '../../components/ui/VaccinationModal';

/**
 * Журнал медичних візитів для ветеринарного лікаря.
 * Дозволяє переглядати історію, редагувати діагнози та призначення.
 */

const EMPTY = { animal: '', visit_date: '', diagnosis: '', prescription: '', status: 'completed', weight_at_visit: '', temperature: '', notes: '' };

export default function VetVisits() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirm, setConfirm] = useState(null);
  const [vacModal, setVacModal] = useState(false);
  const [vacData, setVacData] = useState({ animalId: '', ownerId: '' });
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
      setVisits(extractData(v));
      setAnimals(extractData(a));
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
      const visitData = { ...form };
      delete visitData.status;
      
      await updateVisit(editing.id, visitData);
      if (editing.appointment) {
        await updateAppointment(editing.appointment, { status: 'completed' });
      }

      showToast('Візит оновлено!');
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

      <SearchBar search={search} onSearchChange={setSearch}
        sortOrder={sortOrder} onSortChange={setSortOrder}
        hasFilters={!!(search || filterAnimal || filterOwner || filterStatus || filterDate)}
        onReset={() => { setSearch(''); setFilterAnimal(''); setFilterOwner(''); setFilterStatus(''); setFilterDate(''); }} />

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
                  <th style={{ width: 130, padding: '12px 16px', textAlign: 'center' }}>
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
                  <th style={{ textAlign: 'right', width: 380, padding: '12px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ДІЇ</div>
                    <div style={{ height: 32 }}></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td><strong>{formatDate(v.visit_date)}</strong></td>
                    <td style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {v.visit_time && v.visit_end_time ? `${v.visit_time} — ${v.visit_end_time}` : (v.visit_time || '—')}
                    </td>
                    <td>{v.animal_name}</td>
                    <td>{v.owner_name}</td>
                    <td style={{ fontWeight: 600 }}>{v.diagnosis}</td>
                    <td style={{ color: 'var(--gray-600)' }}>{v.prescription || '—'}</td>
                    <td><StatusBadge status={v.status} /></td>
                    <td style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', paddingRight: 24 }}>
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
        <div className="form-group">
          <button type="button" className="btn btn-outline w-full" onClick={() => {
            setVacData({ animalId: editing?.animal, ownerId: editing?.owner });
            setVacModal(true);
          }}>
            Зареєструвати вакцинацію
          </button>
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
        title="Видалити візит?" message="Ви впевнені, що хочете видалити цей запис? Цю дію неможливо скасувати." danger />

      <VaccinationModal
        open={vacModal}
        onClose={() => setVacModal(false)}
        initialAnimalId={vacData.animalId}
        initialOwnerId={vacData.ownerId}
      />
    </div>
  );
}
