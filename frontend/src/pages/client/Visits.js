import React, { useEffect, useState } from 'react';
import { getVisits } from '../../api/visits';
import { getAnimals } from '../../api/animals';
import { Spinner, StatusBadge, EmptyState, Modal } from '../../components/ui';

/**
 * Сторінка перегляду історії візитів для клієнта.
 * Дозволяє бачити всі медичні висновки та призначення для своїх тварин.
 */

export default function ClientVisits() {
  const [visits, setVisits] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [pet, setPet] = useState('');

  // Завантаження даних про візити та тварин при ініціалізації
  useEffect(() => {
    Promise.all([getVisits(), getAnimals()]).then(([v, a]) => {
      setVisits(v.data.results || v.data);
      setAnimals(a.data.results || a.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  // Фільтрація списку візитів на основі введених користувачем даних
  const filtered = visits.filter(v => {
    const mSearch = !search || 
      v.diagnosis.toLowerCase().includes(search.toLowerCase()) || 
      (v.prescription && v.prescription.toLowerCase().includes(search.toLowerCase()));
    const mDate = !date || v.visit_date === date;
    const mPet = !pet || String(v.animal) === pet;
    return mSearch && mDate && mPet;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Історія візитів</div>
          <div className="page-subtitle">Медичні записи та призначення для ваших тварин</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{flexWrap: 'wrap', gap: 16}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div className="card-title">Журнал візитів</div>
            {filtered.length > 0 && <span className="badge badge-teal">{filtered.length}</span>}
          </div>
          
          <div style={{display:'flex', gap:10, marginLeft:'auto', flexWrap:'wrap', alignItems:'center'}}>
            <input className="form-input" style={{width:280, height:38}} 
              placeholder="Пошук за діагнозом..."
              value={search} onChange={e => setSearch(e.target.value)} />
            
            <input type="date" className="form-input" style={{width:160, height:38}}
              value={date} onChange={e => setDate(e.target.value)} />

            <select className="form-select" style={{width:200, height:38}} value={pet} onChange={e => setPet(e.target.value)}>
              <option value="">Всі тварини</option>
              {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {(search || date || pet) && <button className="btn btn-gray btn-sm" style={{height:38, padding:'0 14px'}} onClick={()=>{setSearch('');setDate('');setPet('');}}>Скинути</button>}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="card-body"><EmptyState title="Візитів не знайдено" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Дата</th><th>Тварина</th><th>Діагноз</th><th>Призначення</th><th>Лікар</th><th>Статус</th><th>Дії</th></tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id}>
                    <td><strong>{v.visit_date}</strong></td>
                    <td>{v.animal_name}</td>
                    <td style={{maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{v.diagnosis}</td>
                    <td>{v.prescription || '—'}</td>
                    <td>{v.vet_name}</td>
                    <td><StatusBadge status={v.status} /></td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => setDetail(v)}>Деталі</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Деталі візиту — ${detail?.animal_name}`}
        actions={<button className="btn btn-gray" onClick={() => setDetail(null)}>Закрити</button>}>
        {detail && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)'}}>
              <span style={{color: 'var(--gray-500)', fontSize: 14}}>Дата</span>
              <span style={{fontWeight: 600, fontSize: 14}}>{detail.visit_date}</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)'}}>
              <span style={{color: 'var(--gray-500)', fontSize: 14}}>Тварина</span>
              <span style={{fontWeight: 600, fontSize: 14}}>{detail.animal_name}</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)'}}>
              <span style={{color: 'var(--gray-500)', fontSize: 14}}>Лікар</span>
              <span style={{fontWeight: 600, fontSize: 14}}>{detail.vet_name}</span>
            </div>
            
            <div style={{marginTop:16, padding:'14px', background:'var(--teal-bg)', borderRadius:12}}>
              <div style={{fontSize:11, fontWeight:800, color:'var(--teal-dark)', marginBottom:6, textTransform: 'uppercase'}}>Діагноз / Висновок</div>
              <div style={{fontSize:14, lineHeight: 1.5, whiteSpace:'pre-wrap'}}>{detail.diagnosis}</div>
            </div>
            
            {detail.prescription && (
              <div style={{marginTop:12, padding:'14px', background:'var(--gray-50)', borderRadius:12, border:'1px solid var(--gray-200)'}}>
                <div style={{fontSize:11, fontWeight:800, color:'var(--gray-500)', marginBottom:6, textTransform: 'uppercase'}}>Призначення / Рекомендації</div>
                <div style={{fontSize:14, lineHeight: 1.5, whiteSpace:'pre-wrap'}}>{detail.prescription}</div>
              </div>
            )}
            
            {(detail.weight_at_visit || detail.temperature) && (
              <div style={{display:'flex', gap:20, marginTop:16, padding:'0 4px'}}>
                {detail.weight_at_visit && <div><span style={{fontSize:12, color:'var(--gray-500)'}}>Вага:</span> <strong style={{fontSize: 14}}>{detail.weight_at_visit} кг</strong></div>}
                {detail.temperature && <div><span style={{fontSize:12, color:'var(--gray-500)'}}>Темп.:</span> <strong style={{fontSize: 14}}>{detail.temperature} °C</strong></div>}
              </div>
            )}
            
            <div style={{marginTop:16}}><StatusBadge status={detail.status} /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
