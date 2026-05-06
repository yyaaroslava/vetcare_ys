import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAnimal, updateAnimal } from '../../api/animals';
import { getVets, getMe, updateMe } from '../../api/auth';
import { getAppointments, updateAppointment, cancelAppointment } from '../../api/appointments';
import { getVisits } from '../../api/visits';
import { Spinner, Modal, StatusBadge, showToast, ConfirmModal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { formatAge } from '../../utils/formatters';

const TruncatedText = ({ text, maxLength = 60 }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return '—';
  if (text.length <= maxLength) return text;
  return (
    <span>
      {expanded ? text : `${text.substring(0, maxLength)}... `}
      <button 
        type="button" 
        onClick={() => setExpanded(!expanded)} 
        style={{background:'none', border:'none', color:'var(--teal)', fontSize:12, fontWeight:700, cursor:'pointer', padding:0, textDecoration:'underline'}}
      >
        {expanded ? 'Згорнути' : 'Детальніше'}
      </button>
    </span>
  );
};

export default function ClientMedCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isVet = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';
  const rolePrefix = isAdmin ? '/admin' : isVet ? '/vet' : '/client';

  const [animal, setAnimal] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [vets, setVets] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('visits');

  const [editAnimal, setEditAnimal] = useState(null);
  const [editOwner, setEditOwner] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [visitDateFilter, setVisitDateFilter] = useState('');

  const SPECIES_OPTIONS = [
    { value: 'dog', label: 'Собака' },
    { value: 'cat', label: 'Кіт' },
    { value: 'bird', label: 'Птах' },
    { value: 'rabbit', label: 'Кролик' },
    { value: 'other', label: 'Інше' },
  ];

  const loadData = () => {
    Promise.all([
      getAnimal(id),
      getAppointments({ animal: id }),
      getVisits({ animal: id }),
      getVets(),
      getMe()
    ]).then(([a, aps, vis, vts, me]) => {
      setAnimal(a.data);
      setAppointments(aps.data.results || aps.data);
      setVisits(vis.data.results || vis.data);
      setVets(vts.data.results || vts.data);
      setUserProfile(me.data);
    })
    .catch(err => {
      console.error(err);
      showToast('Помилка при завантаженні даних', 'error');
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);

  const setA = (k, v) => setEditAnimal(f => ({ ...f, [k]: v }));
  const setO = (k, v) => setEditOwner(f => ({ ...f, [k]: v }));

  const handleSaveAnimal = async () => {
    setSaving(true);
    try {
      const data = { ...editAnimal };
      if (data.species === 'other' && data.custom_species) {
        data.other_species = data.custom_species;
      } else {
        data.other_species = '';
      }
      delete data.custom_species;
      if (!data.weight) delete data.weight;
      if (!data.birth_date) delete data.birth_date;
      if (!data.vet) delete data.vet;
      
      await updateAnimal(animal.id, data);
      showToast('Дані тварини оновлено!');
      setEditAnimal(null);
      loadData();
    } catch (err) {
      showToast('Помилка при збереженні', 'error');
    } finally { setSaving(false); }
  };

  const handleSaveOwner = async () => {
    setSaving(true);
    try {
      await updateMe(editOwner);
      showToast('Дані власника оновлено!');
      setEditOwner(null);
      loadData();
    } catch (err) {
      showToast('Помилка при збереженні', 'error');
    } finally { setSaving(false); }
  };

  const handleCancel = async () => {
    try {
      await cancelAppointment(cancelTarget.id);
      showToast('Прийом скасовано');
      setCancelTarget(null);
      loadData();
    } catch (err) {
      showToast('Помилка при скасуванні', 'error');
    }
  };

  const handleStatusChange = async (a, status) => {
    try {
      await updateAppointment(a.id, { status });
      showToast('Статус оновлено');
      loadData();
    } catch (err) { showToast('Помилка оновлення статусу', 'error'); }
  };

  if (loading) return <Spinner />;
  if (!animal) return <div className="p-8 text-center">Тварину не знайдено</div>;

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = appointments
    .filter(a => ['pending','confirmed'].includes(a.status) && a.date >= todayStr)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Медична картка</div>
          <div className="page-subtitle">{animal.name} — {animal.species_display}{animal.breed ? ` · ${animal.breed}` : ''}</div>
        </div>
        <div style={{display:'flex',gap:10}}>
          {!isVet && !isAdmin && (
            <button 
              className="btn btn-teal" 
              onClick={() => navigate(`${rolePrefix}/appointments`, { state: { animalId: animal.id } })}
            >
              + Записатися на прийом
            </button>
          )}
          <button className="btn btn-outline" onClick={() => navigate(-1)}>← Назад</button>
        </div>
      </div>

      <div className="medcard-layout">
        <div>
          {/* Left Column: Profile */}
          <div className="pet-profile-card" style={{padding: '30px 24px'}}>
            <div style={{display:'flex',justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <div className="card-title" style={{fontSize:16}}>Пацієнт</div>
              {!isAdmin && <button className="btn btn-outline btn-sm" style={{padding: '4px 12px', borderRadius: 6}} onClick={() => setEditAnimal({ ...animal, custom_species: animal.species === 'other' ? animal.other_species || '' : '' })}>Редагувати</button>}
            </div>
            
            <div style={{display:'flex', gap:24, alignItems:'center', marginBottom:28}}>
              <div>
                <div className="pet-name-lg" style={{textAlign:'left', fontSize:26, marginBottom: 4}}>{animal.name}</div>
                <div className="pet-breed-lg" style={{textAlign:'left', fontSize:14}}>{animal.species_display} · {animal.breed || 'Без породи'}</div>
              </div>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:12, marginBottom:24}}>
              {[
                ['Вага', animal.weight ? `${animal.weight} кг` : '—'],
                ['Вік', formatAge(animal.birth_date)],
                ['Дата народження', animal.birth_date || '—'],
                ['Стать', animal.gender === 'male' ? 'Самець' : animal.gender === 'female' ? 'Самиця' : '—'],
                ['Алергії', animal.allergies || 'Відсутні'],
                ['Хронічні хвороби', animal.chronic_diseases || 'Немає відомостей']
              ].map(([l, v], i) => (
                <div key={l} style={{display:'flex', justifyContent:'space-between', fontSize:14, paddingBottom: i !== 5 ? 8 : 0, borderBottom: i !== 5 ? '1px solid var(--gray-100)' : 'none'}}>
                  <span style={{color:'var(--gray-500)'}}>{l}</span>
                  <span style={{fontWeight:600, color: (l === 'Алергії' && animal.allergies) ? 'var(--red)' : 'var(--gray-800)', textAlign:'right', maxWidth:'60%'}}>{v}</span>
                </div>
              ))}
            </div>

            {animal.notes && (
              <div style={{padding:'12px', background:'var(--teal-bg)', borderRadius:10, marginTop:4}}>
                <div style={{fontSize:10, fontWeight:800, color:'var(--teal)', marginBottom:4, textTransform:'uppercase'}}>Нотатки лікаря</div>
                <div style={{fontSize:13, color:'var(--gray-600)', lineHeight:1.4}}>{animal.notes}</div>
              </div>
            )}
          </div>

          <div className="pet-profile-card" style={{marginTop:16}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
              <div className="card-title" style={{fontSize:16}}>Власник</div>
              {!isVet && !isAdmin && <button className="btn btn-outline btn-sm" style={{padding: '4px 12px', borderRadius: 6}} onClick={() => setEditOwner({...userProfile})}>Редагувати</button>}
            </div>
            <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:20}}>
              <div style={{width:36, height:36, borderRadius:50, background:'var(--teal)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800}}>
                {animal.owner_name?.slice(0,1)}
              </div>
              <div style={{fontWeight:800, color:'var(--gray-800)', fontSize:15}}>{animal.owner_name}</div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:14, paddingBottom: 8, borderBottom: '1px solid var(--gray-100)'}}>
                <span style={{color:'var(--gray-500)'}}>Телефон</span>
                <span style={{fontWeight:600, color:'var(--gray-800)'}}>{animal.owner_phone || '—'}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:14}}>
                <span style={{color:'var(--gray-500)'}}>Email</span>
                <span style={{fontWeight:600, color:'var(--gray-800)'}}>{animal.owner_email || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* Right Column: Upcoming */}
          <div className="card mb-6" style={{border: '1px solid var(--teal-bg)', background: 'var(--teal-bg-light)'}}>
            <div className="card-header" style={{background: 'var(--teal)', color: 'white'}}>
              <div className="card-title" style={{color: 'white'}}>Найближчі прийоми</div>
              <div style={{display:'flex', gap: 10, alignItems: 'center'}}>
                <span className="badge" style={{background: 'rgba(255,255,255,0.2)', color: 'white'}}>{upcoming.length}</span>
                {!isAdmin && <Link to={isVet ? "/vet/schedule" : "/client/appointments"} className="btn btn-outline btn-sm" style={{color: 'white', borderColor: 'white'}}>Всі</Link>}
              </div>
            </div>
            <div className="card-body" style={{padding: '0 20px 20px', maxHeight: 280, overflowY: 'auto'}}>
              {upcoming.length === 0 ? (
                <div style={{textAlign:'center', padding:'30px 0', color:'var(--gray-500)', fontSize:14}}>
                  У цієї тварини немає запланованих прийомів
                </div>
              ) : upcoming.map(a => (
                <div key={a.id} className="appointment-block" style={{ marginTop: 12, background: 'var(--teal-bg)', borderRadius: 16, border: '1px solid rgba(13,148,136,0.1)', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ minWidth: 90, textAlign: 'center' }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--teal)', lineHeight: 1 }}>{a.time?.slice(0, 5)}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-500)', marginTop: 6 }}>{a.date?.split('-').reverse().join('.')}</div>
                    </div>
                    
                    <div style={{ flex: 1, borderLeft: '1px solid var(--gray-200)', paddingLeft: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                           <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 2 }}>{a.description || 'Запит на прийом'}</div>
                           <div style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 12 }}>{animal.name}</div>
                           <StatusBadge status={a.status} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {!isAdmin && isVet && a.status === 'pending' && (
                            <button className="btn btn-teal btn-sm" style={{ borderRadius: 8, padding: '8px 16px' }} onClick={() => handleStatusChange(a, 'confirmed')}>Підтвердити</button>
                          )}
                          {!isAdmin && (isVet || ['pending', 'confirmed'].includes(a.status)) && (
                            <button className="btn btn-red btn-sm" style={{ borderRadius: 8, padding: '8px 16px' }} onClick={() => setCancelTarget(a)}>
                              {isVet && a.status === 'pending' ? 'Відхилити' : 'Скасувати'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Screenshot-style Tabs */}
          <div style={{display:'flex', gap: 16, marginBottom: 16}}>
            <button 
              onClick={() => setActiveTab('vaccinations')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 20px',
                borderRadius: 12,
                border: '2px solid var(--teal)',
                background: activeTab === 'vaccinations' ? 'var(--teal)' : 'white',
                color: activeTab === 'vaccinations' ? 'white' : 'var(--teal-dark)',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Вакцинації (0)
            </button>
            <button 
              onClick={() => setActiveTab('visits')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 20px',
                borderRadius: 12,
                border: '2px solid var(--teal)',
                background: activeTab === 'visits' ? 'var(--teal)' : 'white',
                color: activeTab === 'visits' ? 'white' : 'var(--teal-dark)',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Журнал візитів ({visits.length})
            </button>
          </div>

          <div className="card">
            {activeTab === 'visits' ? (
              <>
                <div className="card-header" style={{borderBottom: 'none', flexWrap: 'wrap', gap: 12}}>
                  <div className="card-title" style={{display:'flex', alignItems:'center', gap: 8, fontSize: 16}}>
                    Журнал візитів
                  </div>
                  <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
                    <input
                      type="date"
                      className="form-input"
                      style={{height: 32, fontSize: 13, padding: '4px 10px', borderRadius: 8, width: 160}}
                      value={visitDateFilter}
                      onChange={e => setVisitDateFilter(e.target.value)}
                    />
                    {visitDateFilter && (
                      <button className="btn btn-sm btn-gray" style={{height: 32, padding: '0 12px', fontSize: 13}} onClick={() => setVisitDateFilter('')}>✕ Скинути</button>
                    )}
                    <span className="badge badge-blue">{visits.filter(v => !visitDateFilter || v.visit_date === visitDateFilter).length} візитів</span>
                  </div>
                </div>
                {visits.length === 0 ? (
                  <div style={{textAlign:'center', padding: 40, color:'var(--gray-400)'}}>Немає медичних записів</div>
                ) : (
                  <div className="table-wrap">
                    <table style={{width: '100%'}}>
                      <thead style={{background: 'var(--teal)'}}>
                        <tr style={{fontSize:13}}>
                          <th style={{padding: '12px 20px', textAlign: 'left', color: '#fff', fontWeight: 600}}>Дата</th>
                          <th style={{padding: '12px 20px', textAlign: 'left', color: '#fff', fontWeight: 600}}>Час</th>
                          <th style={{padding: '12px 20px', textAlign: 'left', color: '#fff', fontWeight: 600}}>Діагноз</th>
                          <th style={{padding: '12px 20px', textAlign: 'left', color: '#fff', fontWeight: 600}}>Призначення</th>
                          <th style={{padding: '12px 20px', textAlign: 'left', color: '#fff', fontWeight: 600}}>Лікар</th>
                          <th style={{padding: '12px 20px', textAlign: 'left', color: '#fff', fontWeight: 600}}>Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visits
                          .filter(v => !visitDateFilter || v.visit_date === visitDateFilter)
                          .map(v => (
                          <tr key={v.id} style={{borderBottom: '1px solid var(--gray-100)'}}>
                            <td style={{padding: '16px 20px', fontSize: 14, fontWeight: 600}}>{v.visit_date}</td>
                            <td style={{padding: '16px 20px', fontSize: 13, color: 'var(--gray-500)'}}>{v.visit_time ? v.visit_time.slice(0,5) : '—'}</td>
                            <td style={{padding: '16px 20px', fontSize: 14, maxWidth: 200}}><TruncatedText text={v.diagnosis} /></td>
                            <td style={{padding: '16px 20px', fontSize: 14, maxWidth: 200}}><TruncatedText text={v.prescription} /></td>
                            <td style={{padding: '16px 20px', fontSize: 14}}>{v.vet_name}</td>
                            <td style={{padding: '16px 20px'}}><StatusBadge status={v.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div style={{textAlign:'center', padding: 60, color:'var(--gray-400)'}}>
                <div style={{fontSize: 16, fontWeight: 700, color: 'var(--gray-600)'}}>Дані про вакцинації відсутні</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={!!editAnimal} onClose={() => setEditAnimal(null)} title="Редагувати тварину"
        actions={<><button className="btn btn-gray" onClick={() => setEditAnimal(null)}>Скасувати</button><button className="btn btn-teal" onClick={handleSaveAnimal} disabled={saving}>Зберегти</button></>}>
        {editAnimal && (
          <div style={{display:'flex', flexDirection:'column', gap: 0}}>
            <div className="grid-2">
              <div className="form-group" style={{marginBottom:0}}>
                <label className="form-label">Кличка *</label>
                <input className="form-input" value={editAnimal.name} onChange={e=>setA('name', e.target.value)} placeholder="Рекс" required />
              </div>
              <div className="form-group" style={{marginBottom:0}}>
                <label className="form-label">Вид *</label>
                <select className="form-select" value={editAnimal.species} onChange={e=>setA('species', e.target.value)}>
                  {SPECIES_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            {editAnimal.species === 'other' && (
              <div className="form-group mt-4">
                <label className="form-label">Вкажіть вид (якщо немає у списку)</label>
                <input className="form-input" value={editAnimal.custom_species || ''} onChange={e=>setA('custom_species', e.target.value)} placeholder="Наприклад: черепаха, хом'як..." />
              </div>
            )}
            <div className="form-group mt-4">
              <label className="form-label">Порода</label>
              <input className="form-input" value={editAnimal.breed || ''} onChange={e=>setA('breed', e.target.value)} placeholder="Лабрадор Ретривер" />
            </div>
            <div className="grid-2">
              <div className="form-group" style={{marginBottom:0}}>
                <label className="form-label">Стать</label>
                <select className="form-select" value={editAnimal.gender || ''} onChange={e=>setA('gender', e.target.value)}>
                  <option value="">— Не вказано —</option>
                  <option value="male">Самець</option>
                  <option value="female">Самиця</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom:0}}>
                <label className="form-label">Дата народження</label>
                <input 
                  className="form-input" 
                  type="date" 
                  value={editAnimal.birth_date || ''} 
                  onChange={e=>setA('birth_date', e.target.value)} 
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="grid-2 mt-4">
              <div className="form-group" style={{marginBottom:0}}>
                <label className="form-label">Вага (кг)</label>
                <input className="form-input" type="number" step="0.1" value={editAnimal.weight || ''} onChange={e=>setA('weight', e.target.value)} placeholder="15" />
              </div>
              <div className="form-group" style={{marginBottom:0}}>
                <label className="form-label">Колір</label>
                <input className="form-input" value={editAnimal.color || ''} onChange={e=>setA('color', e.target.value)} placeholder="Золотистий" />
              </div>
            </div>
            <div className="form-group mt-4">
              <label className="form-label">Алергії</label>
              <input className="form-input" value={editAnimal.allergies || ''} onChange={e=>setA('allergies', e.target.value)} placeholder="Пеніцилін..." />
            </div>
            <div className="form-group mt-4">
              <label className="form-label">Хронічні захворювання</label>
              <input className="form-input" value={editAnimal.chronic_diseases || ''} onChange={e=>setA('chronic_diseases', e.target.value)} placeholder="Наприклад: астма..." />
            </div>
            <div className="form-group">
              <label className="form-label">Лікуючий лікар</label>
              <select className="form-select" value={editAnimal.vet || ''} onChange={e=>setA('vet', e.target.value || null)}>
                <option value="">— Не призначено —</option>
                {vets.map(v => <option key={v.id} value={v.id}>{v.first_name} {v.last_name}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editOwner} onClose={() => setEditOwner(null)} title="Редагувати власника"
        actions={<><button className="btn btn-gray" onClick={() => setEditOwner(null)}>Скасувати</button><button className="btn btn-teal" onClick={handleSaveOwner} disabled={saving}>Зберегти</button></>}>
        {editOwner && (
          <div style={{display:'flex', flexDirection:'column', gap: 12}}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Ім'я</label>
                <input className="form-input" value={editOwner.first_name} onChange={e=>setO('first_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Прізвище</label>
                <input className="form-input" value={editOwner.last_name} onChange={e=>setO('last_name', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Телефон *</label>
              <input className="form-input" value={editOwner.phone} onChange={e=>setO('phone', e.target.value)} placeholder="+380..." />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={editOwner.email} disabled />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel}
        title="Скасувати запис?" message={`Ви дійсно хочете скасувати прийом на ${cancelTarget?.date} о ${cancelTarget?.time?.slice(0,5)}?`} danger />
    </div>
  );
}