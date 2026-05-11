import React, { useEffect, useState } from 'react';
import { getAppointments } from '../../api/appointments';
import { Spinner, StatusBadge, EmptyState, SearchBar } from '../../components/ui';
import { formatDate, extractData } from '../../utils/formatters';

/**
 * Журнал всіх записів на прийом для адміністрації клініки.
 * Тільки перегляд із фільтрацією за тваринами, клієнтами, лікарями.
 */
export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAnimal, setFilterAnimal] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterVet, setFilterVet] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const load = () => getAppointments().then(r => setAppointments(extractData(r))).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  if (loading) return <Spinner />;

  let filtered = [...appointments];
  if (filterDate) filtered = filtered.filter(a => a.date === filterDate);
  if (filterStatus) filtered = filtered.filter(a => a.status === filterStatus);
  if (filterAnimal) filtered = filtered.filter(a => a.animal_name === filterAnimal);
  if (filterClient) filtered = filtered.filter(a => a.client_name === filterClient);
  if (filterVet) filtered = filtered.filter(a => a.vet_name === filterVet);
  if (search) {
    filtered = filtered.filter(a =>
      a.animal_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.vet_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Сортування за датою та часом
  filtered.sort((a, b) => {
    const dateA = `${a.date}T${a.time || '00:00'}`;
    const dateB = `${b.date}T${b.time || '00:00'}`;
    return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
  });



  // Унікальні значення для фільтрів
  const uniqueAnimals = Array.from(new Set(appointments.map(a => a.animal_name).filter(Boolean))).sort();
  const uniqueClients = Array.from(new Set(appointments.map(a => a.client_name).filter(Boolean))).sort();
  const uniqueVets = Array.from(new Set(appointments.map(a => a.vet_name).filter(Boolean))).sort();

  const hasFilters = search || filterDate || filterStatus || filterAnimal || filterClient || filterVet;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Всі прийоми</div>
          <div className="page-subtitle">Журнал записів клініки</div>
        </div>
      </div>

      <SearchBar search={search} onSearchChange={setSearch}
        sortOrder={sortOrder} onSortChange={setSortOrder}
        hasFilters={hasFilters}
        onReset={() => { setSearch(''); setFilterDate(''); setFilterStatus(''); setFilterAnimal(''); setFilterClient(''); setFilterVet(''); }} />

      <div className="card">
        <div className="card-header">
          <div className="card-title">Журнал записів</div>
          <span className="badge badge-teal">{filtered.length}</span>
        </div>
        
        {filtered.length === 0 ? (
          <div className="card-body"><EmptyState icon="" title="Прийомів не знайдено" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead style={{background:'var(--teal)', color:'#fff'}}>
                <tr style={{fontSize:14}}>
                  <th style={{width: 130, padding: '10px 16px', verticalAlign: 'top'}}>
                    <div style={{marginBottom: 6, fontSize: 12, opacity: 0.9}}>ДАТА/ЧАС</div>
                    <input type="date" className="form-input input-xs"
                      value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                  </th>
                  <th style={{width: 140, padding: '10px 16px', verticalAlign: 'top'}}>
                    <div style={{marginBottom: 6, fontSize: 12, opacity: 0.9}}>ТВАРИНА</div>
                    <select className="form-select input-xs"
                      value={filterAnimal} onChange={e => setFilterAnimal(e.target.value)}>
                      <option value="">Всі</option>
                      {uniqueAnimals.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </th>
                  <th style={{width: 140, padding: '10px 16px', verticalAlign: 'top'}}>
                    <div style={{marginBottom: 6, fontSize: 12, opacity: 0.9}}>КЛІЄНТ</div>
                    <select className="form-select input-xs"
                      value={filterClient} onChange={e => setFilterClient(e.target.value)}>
                      <option value="">Всі</option>
                      {uniqueClients.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </th>
                  <th style={{width: 160, padding: '10px 16px', verticalAlign: 'top'}}>
                    <div style={{marginBottom: 6, fontSize: 12, opacity: 0.9}}>ЛІКАР</div>
                    <select className="form-select input-xs"
                      value={filterVet} onChange={e => setFilterVet(e.target.value)}>
                      <option value="">Всі</option>
                      {uniqueVets.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </th>
                  <th style={{padding: '10px 16px', verticalAlign: 'top'}}>
                    <div style={{marginBottom: 6, fontSize: 12, opacity: 0.9}}>ОПИС</div>
                    <div style={{height: 28}}></div>
                  </th>
                  <th style={{width: 140, padding: '10px 16px', verticalAlign: 'top'}}>
                    <div style={{marginBottom: 6, fontSize: 12, opacity: 0.9}}>СТАТУС</div>
                    <select className="form-select input-xs"
                      value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                      <option value="">Всі</option>
                      <option value="pending">Очікується</option>
                      <option value="confirmed">Підтверджено</option>
                      <option value="completed">Виконано</option>
                      <option value="cancelled">Скасовано</option>
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><strong>{formatDate(a.date)}</strong><br /><span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{a.time?.slice(0, 5)}</span></td>
                    <td>{a.animal_name}</td>
                    <td>{a.client_name}</td>
                    <td>{a.vet_name}</td>
                    <td>{a.description || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
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
