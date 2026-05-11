import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnimals } from '../../api/animals';
import { getVets } from '../../api/auth';
import { Spinner, EmptyState, SearchBar } from '../../components/ui';

/**
 * Сторінка перегляду всіх тварин у системі для адміністратора.
 * Відображає зведену таблицю з інформацією про вид, породу, власника та лікаря.
 */

import { formatAge, extractData } from '../../utils/formatters';

export default function AdminAnimals() {
  const [animals, setAnimals] = useState([]);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');
  const [filterVet, setFilterVet] = useState('');

  useEffect(() => {
    Promise.all([
      getAnimals(),
      getVets()
    ]).then(([resAnimals, resVets]) => {
      setAnimals(extractData(resAnimals));
      setVets(extractData(resVets));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  let filtered = [...animals];
  if (filterOwner) filtered = filtered.filter(a => String(a.owner) === filterOwner);
  if (filterSpecies) filtered = filtered.filter(a => a.species_display === filterSpecies);
  if (filterVet) filtered = filtered.filter(a => a.vet_display === filterVet);
  if (search) {
    filtered = filtered.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.breed?.toLowerCase().includes(search.toLowerCase()) ||
      a.species_display?.toLowerCase().includes(search.toLowerCase()) ||
      a.vet_display?.toLowerCase().includes(search.toLowerCase())
    );
  }

  const uniqueOwners = Array.from(new Set(animals.map(a => JSON.stringify({ id: a.owner, name: a.owner_name }))))
    .map(s => JSON.parse(s))
    .filter(o => o.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  const uniqueSpecies = Array.from(new Set(animals.map(a => a.species_display))).filter(Boolean).sort();
  const allVets = vets.map(v => `${v.first_name} ${v.last_name}`).sort();

  const hasFilters = search || filterOwner || filterSpecies || filterVet;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Тварини</div>
          <div className="page-subtitle">Всі зареєстровані тварини ({animals.length})</div>
        </div>
      </div>

      <SearchBar search={search} onSearchChange={setSearch}
        hasFilters={hasFilters}
        onReset={() => { setSearch(''); setFilterOwner(''); setFilterSpecies(''); setFilterVet(''); }} />

      <div className="card">
        <div className="card-header">
          <div className="card-title">Всі тварини</div>
          <span className="badge badge-teal">{filtered.length}</span>
        </div>

        {filtered.length === 0
          ? <div className="card-body"><EmptyState icon="" title="Тварин не знайдено" /></div>
          : <div className="table-wrap">
            <table>
              <thead style={{ background: 'var(--teal)', color: '#fff' }}>
                <tr style={{ fontSize: 13 }}>
                  <th style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 4 }}>ТВАРИНА</div>
                    <div style={{ height: 28 }}></div>
                  </th>
                  <th style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 4 }}>ВИД / ПОРОДА</div>
                    <select className="form-select input-xs"
                      value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)}>
                      <option value="">Всі види</option>
                      {uniqueSpecies.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </th>
                  <th style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 4 }}>ВЛАСНИК</div>
                    <select className="form-select input-xs"
                      value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
                      <option value="">Всі власники</option>
                      {uniqueOwners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </th>
                  <th style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 4 }}>ЛІКАР</div>
                    <select className="form-select input-xs"
                      value={filterVet} onChange={e => setFilterVet(e.target.value)}>
                      <option value="">Всі лікарі</option>
                      {allVets.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </th>
                  <th style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 4 }}>ВІК</div>
                    <div style={{ height: 28 }}></div>
                  </th>
                  <th style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 4 }}>ВАГА</div>
                    <div style={{ height: 28 }}></div>
                  </th>
                  <th style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 4 }}>АЛЕРГІЯ</div>
                    <div style={{ height: 28 }}></div>
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 4 }}>ДІЇ</div>
                    <div style={{ height: 28 }}></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><strong style={{ color: 'var(--teal)' }}>{a.name}</strong></td>
                    <td>{a.species_display} · {a.breed || '—'}</td>
                    <td>{a.owner_name}</td>
                    <td>{a.vet_display || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatAge(a.birth_date)}</td>
                    <td>{a.weight ? `${a.weight} кг` : '—'}</td>
                    <td>{a.allergies ? <span className="badge badge-red">{a.allergies}</span> : <span className="badge badge-green">Немає</span>}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Link to={`/admin/animals/${a.id}`} className="btn btn-teal btn-sm" style={{ fontSize: 12, padding: '6px 14px' }}>Медична картка</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </div>
    </div>
  );
}
