import React, { useEffect, useState } from 'react';
import { getVaccinations } from '../../api/vaccinations';
import { getAnimals } from '../../api/animals';
import { Spinner, StatusBadge, EmptyState, SearchBar } from '../../components/ui';
import { extractData } from '../../utils/formatters';

/**
 * Сторінка перегляду історії вакцинацій для клієнта.
 * Дозволяє відстежувати графік щеплень для всіх своїх тварин.
 */

export default function ClientVaccinations() {
  const [vaccinations, setVaccinations] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [filterAnimal, setFilterAnimal] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getVaccinations(), getAnimals()])
      .then(([vacs, anim]) => {
        setVaccinations(extractData(vacs));
        setAnimals(extractData(anim));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const filtered = vaccinations.filter(v => 
    (!filterAnimal || String(v.animal) === filterAnimal) &&
    (!filterStatus || v.status === filterStatus) &&
    (!search || 
      v.vaccine_name?.toLowerCase().includes(search.toLowerCase()) || 
      v.animal_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.vet_name?.toLowerCase().includes(search.toLowerCase())
    ) &&
    (!searchDate || v.date_given === searchDate)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Вакцинації</div>
          <div className="page-subtitle">Графік та історія щеплень ваших тварин</div>
        </div>
      </div>

      <SearchBar search={search} onSearchChange={setSearch}
        hasFilters={!!(search || searchDate || filterAnimal || filterStatus)}
        onReset={() => { setSearch(''); setSearchDate(''); setFilterAnimal(''); setFilterStatus(''); }} />

      <div className="card">
        <div className="card-header">
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div className="card-title">Журнал щеплень</div>
            <span className="badge badge-teal">{filtered.length} записів</span>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="card-body"><EmptyState title="Немає записів про вакцинації" subtitle="Тут буде відображена історія щеплень ваших пацієнтів." /></div>
        ) : (
          <div className="table-wrap">
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--teal)' }}>
                  <th style={{ width: '40px', padding: '10px 4px', textAlign: 'center', fontSize: 12, fontWeight: 800 }}>#</th>
                  <th style={{ width: '19.2%', padding: '10px 8px', fontSize: 12, fontWeight: 800 }}>ТВАРИНА</th>
                  <th style={{ width: '19.2%', padding: '10px 8px', fontSize: 12, fontWeight: 800 }}>ДАТА</th>
                  <th style={{ width: '19.2%', padding: '10px 8px', fontSize: 12, fontWeight: 800 }}>НАЗВА ВАКЦИНИ</th>
                  <th style={{ width: '19.2%', padding: '10px 8px', fontSize: 12, fontWeight: 800 }}>ЛІКАР</th>
                  <th style={{ width: '19.2%', padding: '10px 8px', textAlign: 'center', fontSize: 12, fontWeight: 800 }}>СТАТУС</th>
                </tr>
                <tr style={{ background: 'var(--teal-dark)' }}>
                  <th style={{ padding: '2px 4px' }}></th>
                  <th style={{ padding: '2px 8px' }}>
                    <select 
                      className="form-select input-xs" 
                      style={{ padding: '2px 4px', fontSize: 11, color: '#000', background: '#fff', borderRadius: 8, height: 24, width: '100%' }}
                      value={filterAnimal} 
                      onChange={e => setFilterAnimal(e.target.value)}
                    >
                      <option value="">Всі</option>
                      {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </th>
                  <th style={{ padding: '2px 8px' }}>
                    <input 
                      type="date" 
                      className="form-input input-xs" 
                      style={{ padding: '2px 4px', fontSize: 11, color: '#000', background: '#fff', borderRadius: 8, height: 24, width: '100%' }}
                      value={searchDate} 
                      onChange={e => setSearchDate(e.target.value)} 
                    />
                  </th>
                  <th style={{ padding: '2px 8px' }}></th>
                  <th style={{ padding: '2px 8px' }}></th>
                  <th style={{ padding: '2px 8px', textAlign: 'center' }}>
                    <select 
                      className="form-select input-xs" 
                      style={{ padding: '2px 4px', fontSize: 11, color: '#000', background: '#fff', borderRadius: 8, height: 24, width: '100px', margin: '0 auto' }}
                      value={filterStatus} 
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      <option value="">Всі</option>
                      <option value="done">Виконано</option>
                      <option value="planned">Заплановано</option>
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => (
                  <tr key={v.id} style={{ fontSize: 16, height: 55 }}>
                    <td style={{ textAlign: 'center', padding: '8px 4px', color: 'var(--gray-400)' }}>{i+1}</td>
                    <td style={{ padding: '8px 8px', fontWeight: 600 }}>{v.animal_name}</td>
                    <td style={{ padding: '8px 8px' }}>{v.date_given}</td>
                    <td style={{ padding: '8px 8px', fontWeight: 500 }}>{v.vaccine_name}</td>
                    <td style={{ padding: '8px 8px', color: 'var(--gray-600)' }}>{v.vet_name || '—'}</td>
                    <td style={{ textAlign: 'center', padding: '8px 8px' }}>
                      <div style={{ transform: 'scale(1.2)', display: 'inline-block' }}>
                        <StatusBadge status={v.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
