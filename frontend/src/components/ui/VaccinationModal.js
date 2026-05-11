import React, { useState, useEffect } from 'react';
import { Modal, showToast } from './index';
import { getAnimals } from '../../api/animals';
import { getClients } from '../../api/auth';
import { createVaccination } from '../../api/vaccinations';
import { extractData } from '../../utils/formatters';

/**
 * Універсальне модальне вікно для реєстрації вакцинації.
 * Може використовуватися на будь-якій сторінці (Дашборд, Журнал, Картка).
 */
export default function VaccinationModal({ open, onClose, onSuccess, initialAnimalId, initialOwnerId }) {
  const [animals, setAnimals] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  
  const [form, setForm] = useState({
    animal: '',
    vaccine_name: '',
    date_given: new Date().toISOString().split('T')[0],
    next_date: '',
    notes: '',
    status: 'done'
  });

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([getAnimals(), getClients()])
        .then(([aRes, cRes]) => {
          const aData = extractData(aRes);
          const cData = extractData(cRes);
          setAnimals(aData);
          setClients(cData);

          if (initialOwnerId) {
            setSelectedClientId(initialOwnerId);
            const owner = cData.find(c => String(c.id) === String(initialOwnerId));
            if (owner) setOwnerSearch(`${owner.first_name} ${owner.last_name}`);
          }
          if (initialAnimalId) {
            setForm(f => ({ ...f, animal: initialAnimalId }));
          }
        })
        .finally(() => setLoading(false));
    }
  }, [open, initialAnimalId, initialOwnerId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.animal || !form.vaccine_name || (!form.date_given && !form.next_date)) {
      showToast('Заповніть обов\'язкові поля', 'error');
      return;
    }
    setSaving(true);
    try {
      const cleanData = {
        ...form,
        date_given: form.date_given || null,
        next_date: form.next_date || null,
      };

      if (cleanData.date_given) {
        await createVaccination({ ...cleanData, status: 'done' });
      }
      if (cleanData.next_date) {
        await createVaccination({
          ...cleanData,
          date_given: cleanData.next_date,
          next_date: null,
          status: 'planned',
          notes: form.date_given ? `Заплановано при реєстрації щеплення. ${form.notes || ''}` : form.notes
        });
      }

      showToast('Вакцинацію зареєстровано!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showToast('Помилка при збереженні', 'error');
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Реєстрація вакцинації"
      actions={<>
        <button className="btn btn-gray" onClick={onClose}>Скасувати</button>
        <button className="btn btn-teal" onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Збереження...' : 'Зберегти'}
        </button>
      </>}>
      
      <div className="form-group">
        <label className="form-label">Власник *</label>
        <input
          className="form-input"
          list="shared-clients-list"
          placeholder="Почніть вводити ім'я..."
          value={ownerSearch}
          onChange={e => {
            const val = e.target.value;
            setOwnerSearch(val);
            const found = clients.find(c => `${c.first_name} ${c.last_name}` === val || c.email === val);
            if (found) {
              setSelectedClientId(found.id);
              set('animal', '');
            } else {
              setSelectedClientId('');
            }
          }}
        />
        <datalist id="shared-clients-list">
          {clients.map(c => <option key={c.id} value={`${c.first_name} ${c.last_name}`} />)}
        </datalist>
      </div>

      <div className="form-group">
        <label className="form-label">Пацієнт *</label>
        <select className="form-select" value={form.animal} onChange={e => set('animal', e.target.value)} disabled={!selectedClientId}>
          <option value="">— {selectedClientId ? 'Оберіть тварину' : 'Спочатку оберіть власника'} —</option>
          {animals.filter(a => !selectedClientId || String(a.owner) === String(selectedClientId)).map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Назва вакцини *</label>
        <input className="form-input" value={form.vaccine_name} onChange={e => set('vaccine_name', e.target.value)} placeholder="Наприклад: Мультикан-8" />
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Дата щеплення</label>
          <input className="form-input" type="date" value={form.date_given} onChange={e => set('date_given', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Наступна вакцинація</label>
          <input className="form-input" type="date" value={form.next_date} onChange={e => set('next_date', e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Нотатки</label>
        <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Додаткова інформація..." />
      </div>
    </Modal>
  );
}
