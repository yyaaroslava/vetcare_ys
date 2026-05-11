import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getVaccinations, createVaccination, updateVaccination, deleteVaccination } from '../../api/vaccinations';
import { getAnimals } from '../../api/animals';
import { getClients } from '../../api/auth';
import { Spinner, Modal, StatusBadge, EmptyState, showToast, ConfirmModal, SearchBar } from '../../components/ui';
import { extractData } from '../../utils/formatters';

/**
 * Журнал вакцинацій для ветеринарного лікаря.
 * Дозволяє реєструвати нові щеплення, планувати наступні візити та переглядати історію.
 */

const EMPTY = {
  animal: '',
  vaccine_name: '',
  vaccine_type: '',
  date_given: new Date().toISOString().split('T')[0],
  next_date: '',
  status: 'done',
  batch_number: '',
  notes: ''
};

export default function VetVaccinations() {
  const [vacs, setVacs] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAnimal, setFilterAnimal] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVaccine, setFilterVaccine] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const [selectedClientId, setSelectedClientId] = useState('');
  const [ownerSearch, setOwnerSearch] = useState('');

  // Завантаження даних про вакцинації та пацієнтів
  const load = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      getVaccinations(),
      getAnimals(),
      getClients()
    ]);

    const [vRes, aRes, cRes] = results;

    if (vRes.status === 'fulfilled') {
      setVacs(extractData(vRes.value));
    } else {
      const detail = vRes.reason?.response?.data?.detail || vRes.reason?.message || 'Невідома помилка';
      showToast(`Помилка завантаження вакцинацій: ${detail}`, 'error');
      console.error('Vacs error:', vRes.reason);
    }

    if (aRes.status === 'fulfilled') {
      setAnimals(extractData(aRes.value));
    } else {
      showToast('Помилка завантаження тварин', 'error');
      console.error('Animals error:', aRes.reason);
    }

    if (cRes.status === 'fulfilled') {
      setClients(extractData(cRes.value));
    } else {
      showToast('Помилка завантаження списку клієнтів', 'error');
      console.error('Clients error:', cRes.reason);
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, date_given: new Date().toISOString().split('T')[0] });
    setSelectedClientId('');
    setOwnerSearch('');
    setModal(true);
  };

  const openEdit = v => {
    setEditing(v);
    setForm({
      animal: v.animal,
      vaccine_name: v.vaccine_name,
      vaccine_type: v.vaccine_type || '',
      date_given: v.date_given,
      next_date: v.next_date || '',
      status: v.status,
      batch_number: v.batch_number || '',
      notes: v.notes || ''
    });
    // Знаходимо власника тварини для вибору в селекті клієнта
    const pet = animals.find(a => a.id === v.animal);
    if (pet) {
      setSelectedClientId(pet.owner);
      const owner = clients.find(c => c.id === pet.owner);
      if (owner) setOwnerSearch(`${owner.first_name} ${owner.last_name}`);
    }
    setModal(true);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    // Перевірка: хоча б одна дата має бути заповнена
    if (!form.animal || !form.vaccine_name || (!form.date_given && !form.next_date)) {
      showToast('Заповніть назву вакцини та хоча б одну з дат (щеплення або наступна)', 'error');
      return;
    }
    setSaving(true);
    try {
      // Очищення даних перед відправкою (пусті дати мають бути null, а не "")
      const cleanData = {
        ...form,
        date_given: form.date_given || null,
        next_date: form.next_date || null,
        vaccine_type: form.vaccine_type || undefined,
        batch_number: form.batch_number || undefined,
        notes: form.notes || undefined
      };

      // Логіка визначення статусу
      // Якщо вказана дата проведення — статус "виконано"
      // Якщо тільки планова дата — статус "заплановано"
      if (cleanData.date_given) {
        cleanData.status = 'done';
      } else if (cleanData.next_date) {
        cleanData.status = 'planned';
      }

      if (editing) {
        // При редагуванні оновлюємо поточний запис
        await updateVaccination(editing.id, cleanData);
      } else {
        // При створенні нового:

        // 1. Якщо є дата щеплення — створюємо виконаний запис
        if (cleanData.date_given) {
          await createVaccination({
            ...cleanData,
            status: 'done'
          });
        }

        // 2. Якщо є наступна дата (і це не був просто один 'done' запис) — створюємо окремий запланований запис
        if (cleanData.next_date) {
          // Якщо ми вже створили 'done' запис, де next_date вказано, 
          // створюємо ОКРЕМИЙ запис зі статусом 'planned' для майбутнього
          await createVaccination({
            ...cleanData,
            date_given: cleanData.next_date,
            next_date: null,
            status: 'planned',
            notes: form.date_given ? `Заплановано при реєстрації щеплення від ${form.date_given}. ${form.notes || ''}` : form.notes
          });
        }
      }

      showToast(editing ? 'Запис оновлено' : 'Дані успішно збережено');
      setModal(false);
      load();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Помилка при збереженні';
      showToast(msg, 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteVaccination(confirm.id);
      showToast('Запис видалено');
      setConfirm(null);
      load();
    } catch (err) {
      showToast('Помилка при видаленні', 'error');
    }
  };

  if (loading) return <Spinner />;

  // Логіка фільтрації
  let filtered = vacs;
  if (filterAnimal) filtered = filtered.filter(v => String(v.animal) === filterAnimal);
  if (filterOwner) {
    const ownerPets = animals.filter(a => String(a.owner_id || a.owner) === filterOwner).map(a => a.id);
    filtered = filtered.filter(v => ownerPets.includes(v.animal));
  }
  if (filterDate) filtered = filtered.filter(v => v.date_given === filterDate);
  if (filterStatus) filtered = filtered.filter(v => v.status === filterStatus);
  if (filterVaccine) filtered = filtered.filter(v => v.vaccine_name?.toLowerCase().includes(filterVaccine.toLowerCase()));

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(v =>
      v.animal_name?.toLowerCase().includes(s) ||
      v.vaccine_name?.toLowerCase().includes(s)
    );
  }

  filtered.sort((a, b) => {
    const valA = a.date_given || '';
    const valB = b.date_given || '';
    return sortOrder === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
  });

  const uniqueOwners = Array.from(new Set(animals.map(a => JSON.stringify({ id: a.owner_id || a.owner, name: a.owner_name }))))
    .map(s => JSON.parse(s))
    .filter(o => o.id);

  const displayAnimals = animals.filter(a => !filterOwner || String(a.owner_id || a.owner) === filterOwner);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Вакцинації</div>
          <div className="page-subtitle">Облік та планування щеплень пацієнтів</div>
        </div>
        <button className="btn btn-teal" style={{ padding: '12px 24px', fontSize: 16, fontWeight: 700 }} onClick={openAdd}>+ Додати вакцинацію</button>
      </div>

      <SearchBar search={search} onSearchChange={setSearch}
        sortOrder={sortOrder} onSortChange={setSortOrder}
        hasFilters={!!(search || filterAnimal || filterOwner || filterDate || filterStatus || filterVaccine)}
        onReset={() => { setSearch(''); setFilterAnimal(''); setFilterOwner(''); setFilterDate(''); setFilterStatus(''); setFilterVaccine(''); }} />

      <div className="card">
        <div className="card-header">
          <div className="card-title">Журнал щеплень</div>
          <span className="badge badge-blue">{filtered.length} записів</span>
        </div>
        {filtered.length === 0 ? (
          <div className="card-body"><EmptyState title="Вакцинацій не знайдено" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead style={{ background: 'var(--teal)', color: '#fff' }}>
                <tr style={{ verticalAlign: 'top' }}>
                  <th style={{ width: '20%', padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ДАТА</div>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <input type="date" className="form-input input-xs" style={{ width: '100%' }}
                        value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                    </div>
                  </th>
                  <th style={{ width: '20%', padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ВЛАСНИК</div>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <select className="form-select input-xs" style={{ width: '100%' }}
                        value={filterOwner} onChange={e => { setFilterOwner(e.target.value); setFilterAnimal(''); }}>
                        <option value="">Всі</option>
                        {uniqueOwners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  </th>
                  <th style={{ width: '20%', padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ТВАРИНА</div>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <select className="form-select input-xs" style={{ width: '100%' }}
                        value={filterAnimal} onChange={e => setFilterAnimal(e.target.value)}>
                        <option value="">Всі</option>
                        {displayAnimals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </th>
                  <th style={{ width: '20%', padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>НАЗВА ВАКЦИНИ</div>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <input className="form-input input-xs" placeholder="Пошук..." style={{ width: '100%' }}
                        value={filterVaccine} onChange={e => setFilterVaccine(e.target.value)} />
                    </div>
                  </th>
                  <th style={{ width: '20%', padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>СТАТУС</div>
                    <div style={{ height: 32, display: 'flex', alignItems: 'center' }}>
                      <select className="form-select input-xs" style={{ width: '100%' }}
                        value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Всі</option>
                        <option value="done">Виконано</option>
                        <option value="planned">Заплановано</option>
                      </select>
                    </div>
                  </th>
                  <th style={{ textAlign: 'center', width: 320, padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9, marginBottom: 8 }}>ДІЇ</div>
                    <div style={{ height: 32 }}></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td style={{ width: '20%' }}><strong>{v.date_given || '—'}</strong></td>
                    <td style={{ width: '20%' }}>{v.owner_name}</td>
                    <td style={{ width: '20%' }}>{v.animal_name}</td>
                    <td style={{ width: '20%' }}><span style={{ fontWeight: 700 }}>{v.vaccine_name}</span></td>
                    <td style={{ width: '20%' }}><StatusBadge status={v.status} /></td>
                    <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center', width: 320 }}>
                      <button className="btn btn-outline btn-sm" style={{ width: 90, height: 42, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => openEdit(v)}>Редагувати</button>
                      <Link to={`/vet/patients/${v.animal}`} className="btn btn-teal" style={{ padding: '6px 12px', fontSize: '11px', textAlign: 'center', lineHeight: 1.2, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 90, textDecoration: 'none' }}>
                        Медична<br />картка
                      </Link>
                      <button className="btn btn-red btn-sm" style={{ width: 90, height: 42, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirm(v)}>Видалити</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Редагувати запис' : 'Реєстрація вакцинації'}
        actions={<>
          <button className="btn btn-gray" onClick={() => setModal(false)}>Скасувати</button>
          <button className="btn btn-teal" onClick={handleSave} disabled={saving}>
            {saving ? 'Збереження...' : 'Зберегти'}
          </button>
        </>}>
        <div className="form-group">
          <label className="form-label">Власник *</label>
          <input
            className="form-input"
            list="clients-list"
            placeholder="Почніть вводити ім'я..."
            value={ownerSearch}
            onChange={e => {
              const val = e.target.value;
              setOwnerSearch(val);
              const found = clients.find(c =>
                `${c.first_name} ${c.last_name}` === val ||
                `${c.first_name} ${c.last_name} (${c.email})` === val ||
                c.email === val
              );
              if (found) {
                setSelectedClientId(found.id);
                set('animal', '');
              } else {
                setSelectedClientId('');
              }
            }}
          />
          <datalist id="clients-list">
            {clients.map(c => (
              <option key={c.id} value={`${c.first_name} ${c.last_name}`} label={c.email} />
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label className="form-label">Пацієнт *</label>
          <select
            className="form-select"
            value={form.animal}
            onChange={e => set('animal', e.target.value)}
            disabled={!selectedClientId}
          >
            <option value="">— {selectedClientId ? 'Оберіть тварину' : 'Спочатку оберіть власника'} —</option>
            {animals
              .filter(a => !selectedClientId || String(a.owner) === String(selectedClientId))
              .map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))
            }
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Назва вакцини *</label>
          <input className="form-input" value={form.vaccine_name} onChange={e => set('vaccine_name', e.target.value)} placeholder="Наприклад: Мультикан-8" />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Дата щеплення</label>
            <input className="form-input" type="date" max={new Date().toISOString().split('T')[0]} value={form.date_given} onChange={e => set('date_given', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Наступна вакцинація</label>
            <input className="form-input" type="date" min={new Date().toISOString().split('T')[0]} value={form.next_date} onChange={e => set('next_date', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Нотатки</label>
          <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Додаткова інформація..." />
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        title="Видалити запис?"
        message={`Ви дійсно хочете видалити інформацію про вакцинацію ${confirm?.vaccine_name} для тварини ${confirm?.animal_name}?`}
        danger
      />
    </div>
  );
}
