import React, { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/auth';
import { Spinner, Modal, EmptyState, showToast, ConfirmModal, Badge, roleLabel, roleBadgeColor, SearchBar } from '../../components/ui';
import { formatDate, extractData } from '../../utils/formatters';

const EMPTY = { email: '', first_name: '', last_name: '', phone: '+380', role: 'client', password: '' };

/**
 * Панель управління користувачами (доступна тільки Адміністратору).
 * Дозволяє переглядати список, фільтрувати за ролями та додавати нових користувачів.
 */
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const load = () => getUsers().then(r => setUsers(extractData(r))).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setModal(true);
  };
  const openEdit = u => {
    setEditing(u);
    setForm({ email: u.email, first_name: u.first_name, last_name: u.last_name, phone: u.phone || '+380', role: u.role, password: '' });
    setModal(true);
  };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editing) await updateUser(editing.id, data);
      else await createUser(data);
      showToast(editing ? 'Користувача оновлено!' : 'Користувача створено!');
      setModal(false);
      load();
    } catch (err) {
      const msgs = Object.values(err.response?.data || {}).flat().join(' ');
      showToast(msgs || 'Помилка збереження', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await deleteUser(confirm.id);
    showToast('Користувача видалено'); setConfirm(null); load();
  };

  if (loading) return <Spinner />;

  let filtered = users;
  if (search) filtered = filtered.filter(u => `${u.first_name} ${u.last_name} ${u.email} ${u.phone || ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Користувачі</div>
          <div className="page-subtitle">Управління доступом</div>
        </div>
        <button className="btn btn-teal" onClick={openAdd}>+ Додати</button>
      </div>

      <SearchBar search={search} onSearchChange={setSearch}
        hasFilters={!!(search || filterRole)}
        onReset={() => { setSearch(''); setFilterRole(''); }} />

      <div className="card">
        <div className="card-header">
          <div className="card-title">Користувачі системи</div>
          <span className="badge badge-teal">{filtered.length}</span>
        </div>

        {filtered.length === 0
          ? <div className="card-body"><EmptyState icon="" title="Користувачів не знайдено" /></div>
          : <div className="table-wrap">
            <table style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead style={{ background: 'var(--teal)', color: '#fff' }}>
                <tr style={{ fontSize: 14 }}>
                  <th style={{ width: '16.66%', padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 6, fontSize: 12, opacity: 0.9 }}>КОРИСТУВАЧ</div>
                    <div style={{ height: 28 }}></div>
                  </th>
                  <th style={{ width: '16.66%', padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 6, fontSize: 12, opacity: 0.9 }}>EMAIL</div>
                    <div style={{ height: 28 }}></div>
                  </th>
                  <th style={{ width: '16.66%', padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 6, fontSize: 12, opacity: 0.9 }}>ТЕЛЕФОН</div>
                    <div style={{ height: 28 }}></div>
                  </th>
                  <th style={{ width: '16.66%', padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 6, fontSize: 12, opacity: 0.9 }}>РОЛЬ</div>
                    <select className="form-select input-xs"
                      value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                      <option value="">Всі ролі</option>
                      <option value="admin">Адміністратор</option>
                      <option value="doctor">Лікар</option>
                      <option value="client">Клієнт</option>
                    </select>
                  </th>
                  <th style={{ width: '16.66%', padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 6, fontSize: 12, opacity: 0.9 }}>РЕЄСТРАЦІЯ</div>
                    <div style={{ height: 28 }}></div>
                  </th>
                  <th style={{ width: '16.66%', textAlign: 'center', padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 6, fontSize: 12, opacity: 0.9 }}>ДІЇ</div>
                    <div style={{ height: 28 }}></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const initials = `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase() || u.email[0].toUpperCase();
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--teal-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {initials}
                          </div>
                          <div style={{ fontWeight: 700 }}>{u.first_name} {u.last_name}</div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td><Badge color={roleBadgeColor(u.role)}>{roleLabel(u.role)}</Badge></td>
                      <td>{u.created_at ? formatDate(u.created_at.split('T')[0]) : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>Редагувати</button>
                          <button className="btn btn-red btn-sm" onClick={() => setConfirm(u)}>Видалити</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>}
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Редагувати користувача' : 'Новий користувач'}
        actions={<>
          <button className="btn btn-gray" onClick={() => setModal(false)}>Скасувати</button>
          <button className="btn btn-teal" onClick={handleSave} disabled={saving}>{saving ? '...' : 'Зберегти'}</button>
        </>}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Ім'я</label>
            <input className="form-input" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Прізвище</label>
            <input className="form-input" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Телефон *</label>
          <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+380XXXXXXXXX" maxLength={13} />
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>Формат: +380XXXXXXXXX (макс. 13 символів)</div>
        </div>
        <div className="form-group">
          <label className="form-label">Роль</label>
          <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="client">Клієнт</option>
            <option value="doctor">Лікар</option>
            <option value="admin">Адміністратор</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{editing ? 'Новий пароль (залиште порожнім)' : 'Пароль *'}</label>
          <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} />
        </div>
      </Modal>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleDelete}
        title="Видалити користувача?" message={`Видалити ${confirm?.email}?`} danger />
    </div>
  );
}
