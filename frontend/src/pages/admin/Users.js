import React, { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/auth';
import { Spinner, Modal, EmptyState, showToast, ConfirmModal, Badge, roleLabel, roleBadgeColor } from '../../components/ui';

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

  const load = () => getUsers().then(r => setUsers(r.data.results || r.data)).finally(() => setLoading(false));
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
  if (search) filtered = filtered.filter(u => `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()));
  if (filterRole) filtered = filtered.filter(u => u.role === filterRole);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Користувачі</div>
          <div className="page-subtitle">Управління доступом</div>
        </div>
        <button className="btn btn-teal" onClick={openAdd}>+ Додати</button>
      </div>

      <div className="flex gap-2 mb-2" style={{ alignItems: 'center' }}>
        <input className="form-input" style={{ flex: 1, maxWidth: 500, fontSize: 16 }}
          placeholder="Швидкий пошук"
          value={search} onChange={e => setSearch(e.target.value)} />
        {(search || filterRole) && (
          <button className="btn btn-gray btn-sm" onClick={() => { setSearch(''); setFilterRole(''); }}>
            Скинути все
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Користувачі системи</div>
          <span className="badge badge-teal">{filtered.length}</span>
        </div>

        {filtered.length === 0
          ? <div className="card-body"><EmptyState icon="" title="Користувачів не знайдено" /></div>
          : <div className="table-wrap">
            <table>
              <thead style={{ background: 'var(--teal)', color: '#fff' }}>
                <tr style={{ fontSize: 14 }}>
                  <th style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 6, fontSize: 12, opacity: 0.9 }}>КОРИСТУВАЧ</div>
                    <div style={{ height: 28 }}></div>
                  </th>
                  <th style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 6, fontSize: 12, opacity: 0.9 }}>EMAIL</div>
                    <div style={{ height: 28 }}></div>
                  </th>
                  <th style={{ width: 160, padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: 6, fontSize: 12, opacity: 0.9 }}>РОЛЬ</div>
                    <select className="form-select input-xs"
                      value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                      <option value="">Всі ролі</option>
                      <option value="admin">Адміністратор</option>
                      <option value="doctor">Лікар</option>
                      <option value="client">Клієнт</option>
                    </select>
                  </th>
                  <th style={{ textAlign: 'center', width: 200, padding: '10px 16px', verticalAlign: 'top' }}>
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
                      <td><Badge color={roleBadgeColor(u.role)}>{roleLabel(u.role)}</Badge></td>
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
