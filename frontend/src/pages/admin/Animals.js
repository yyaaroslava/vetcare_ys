import React, { useEffect, useState } from 'react';
import { getAnimals } from '../../api/animals';
import { Spinner, EmptyState, speciesEmoji } from '../../components/ui';

/**
 * Сторінка перегляду всіх тварин у системі для адміністратора.
 * Відображає зведену таблицю з інформацією про вид, породу та власника.
 */
export default function AdminAnimals() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAnimals().then(r => setAnimals(r.data.results || r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  let filtered = animals.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.breed?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Тварини</div>
          <div className="page-subtitle">Всі зареєстровані тварини ({animals.length})</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{flex: 1}}>
            <div className="card-title">Всі тварини</div>
            <div style={{fontSize: 12, color: 'var(--gray-500)', marginTop: 2}}>Знайдено: {filtered.length}</div>
          </div>
          <input className="form-input" style={{width: 320}} placeholder="Пошук за кличкою, власником..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        
        {filtered.length === 0
          ? <div className="card-body"><EmptyState icon="" title="Тварин не знайдено" /></div>
          : <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Тварина</th><th>Вид / Порода</th><th>Власник</th><th>Вага</th><th>Алергія</th><th>Реєстрація</th></tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{fontSize:18,marginRight:8}}>{speciesEmoji(a.species)}</span><strong>{a.name}</strong></td>
                    <td>{a.species_display} · {a.breed||'—'}</td>
                    <td>{a.owner_name}</td>
                    <td>{a.weight ? `${a.weight} кг` : '—'}</td>
                    <td>{a.allergies ? <span className="badge badge-red">{a.allergies}</span> : <span className="badge badge-green">Немає</span>}</td>
                    <td>{new Date(a.created_at).toLocaleDateString('uk-UA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </div>
    </div>
  );
}
