import React, { useState, useEffect } from 'react';

// ─── Toast ───────────────────────────────────────────────
let _setToast = null;
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  _setToast = setToast;
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3200);
      return () => clearTimeout(t);
    }
  }, [toast]);
  return (
    <>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
};
export const showToast = (message, type = 'success') => _setToast && _setToast({ message, type });

// ─── Modal ───────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, actions }) => {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        {title && <div className="modal-title">{title}</div>}
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
};

// ─── Spinner ─────────────────────────────────────────────
export const Spinner = ({ size = 28 }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
    <div className="spinner" style={{ width: size, height: size }} />
  </div>
);

// ─── Badge ───────────────────────────────────────────────
export const Badge = ({ color = 'gray', children }) => (
  <span className={`badge badge-${color}`}>{children}</span>
);

// ─── StatusBadge ─────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    pending: { color: 'orange', label: 'Очікується' },
    confirmed: { color: 'blue', label: 'Підтверджено' },
    completed: { color: 'green', label: 'Виконано' },
    cancelled: { color: 'red', label: 'Скасовано' },
    done: { color: 'green', label: 'Виконано' },
    planned: { color: 'orange', label: 'Заплановано' },
    overdue: { color: 'red', label: 'Прострочено' },
    follow_up: { color: 'blue', label: 'Повторний огляд' },
  };
  const s = map[status] || { color: 'gray', label: status };
  return <Badge color={s.color}>{s.label}</Badge>;
};

// ─── ConfirmModal ─────────────────────────────────────────
export const ConfirmModal = ({ open, onClose, onConfirm, title, message, danger }) => (
  <Modal open={open} onClose={onClose} title={title}
    actions={<>
      <button className="btn btn-gray" onClick={onClose}>Скасувати</button>
      <button className={`btn ${danger ? 'btn-red' : 'btn-teal'}`} onClick={onConfirm}>Підтвердити</button>
    </>}>
    <p style={{ color: 'var(--gray-600)', fontSize: 14 }}>{message}</p>
  </Modal>
);

// ─── Empty State ─────────────────────────────────────────
export const EmptyState = ({ title, subtitle, action }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--gray-400)' }}>
    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6 }}>{title}</div>
    {subtitle && <div style={{ fontSize: 13, marginBottom: 16 }}>{subtitle}</div>}
    {action}
  </div>
);

// ─── Species emoji helper ─────────────────────────────────
export const speciesEmoji = s => {
  const map = {
    dog: '🐶',
    cat: '🐱',
    bird: '🦜',
    rabbit: '🐰',
    other: '🐾',
    // Також додамо українські назви на всяк випадок
    'Собака': '🐶',
    'Кіт': '🐱',
    'Кішка': '🐱',
    'Птах': '🦜',
    'Кролик': '🐰'
  };
  return map[s] || '🐾';
};

// ─── Role label ───────────────────────────────────────────
export const roleLabel = r => ({
  client: 'Власник',
  doctor: 'Лікар',
  vet: 'Лікар', // legacy role value from old init scripts
  admin: 'Адміністратор',
}[r] || r);
export const roleBadgeColor = r => ({
  client: 'blue',
  doctor: 'teal',
  vet: 'teal',
  admin: 'orange',
}[r] || 'gray');

// ─── SearchBar ────────────────────────────────────────────
/**
 * Уніфікований компонент пошукового рядка з сортуванням та кнопкою скидання.
 * Використовується на всіх сторінках з таблицями для DRY.
 */
export const SearchBar = ({ search, onSearchChange, sortOrder, onSortChange, hasFilters, onReset }) => (
  <div className="flex gap-2 mb-2" style={{ alignItems: 'center' }}>
    <input className="form-input" style={{ flex: 1, maxWidth: 500, fontSize: 16 }}
      placeholder="Швидкий пошук"
      value={search} onChange={e => onSearchChange(e.target.value)} />
    {onSortChange && (
      <select className="form-select" style={{ width: 180 }} value={sortOrder} onChange={e => onSortChange(e.target.value)}>
        <option value="desc">Спочатку нові</option>
        <option value="asc">Спочатку старі</option>
      </select>
    )}
    {hasFilters && (
      <button className="btn btn-gray btn-sm" onClick={onReset}>Скинути все</button>
    )}
  </div>
);

// ─── Shared Business Modals ────────────────────────────────
export { default as VaccinationModal } from './VaccinationModal';
export { default as TimeSlotGrid } from './TimeSlotGrid';
