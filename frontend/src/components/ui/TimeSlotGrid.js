import React from 'react';

/**
 * Компонент для відображення сітки часових слотів.
 * Використовується в модальних вікнах запису на прийом.
 */
export const TimeSlotGrid = ({ slots, selectedTime, onSelect, loading }) => {
  if (loading) {
    return <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Завантаження вільних слотів...</div>;
  }

  // Генерація базового списку часу (08:00 - 17:00 з кроком 30 хв)
  const baseTimes = Array.from({ length: 19 }, (_, i) => {
    const h = Math.floor(i / 2) + 8;
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
  });

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {baseTimes.map(time => {
          // Пошук статусу слота в даних з API
          const apiSlot = slots.find(s => s.time.slice(0, 5) === time || s.time === time);
          const isFree = slots.length > 0 ? (apiSlot ? apiSlot.free : false) : true;

          return (
            <button
              key={time}
              type="button"
              onClick={() => isFree && onSelect(time)}
              className={`btn btn-sm ${time === selectedTime ? 'btn-teal' : isFree ? 'btn-outline' : 'btn-gray'}`}
              disabled={!isFree}
              style={{ 
                opacity: isFree ? 1 : 0.4, 
                cursor: isFree ? 'pointer' : 'not-allowed',
                minWidth: '65px'
              }}
            >
              {time}{!isFree ? ' ✕' : ''}
            </button>
          );
        })}
      </div>
      {selectedTime && (
        <div style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700 }}>
          ✓ Обрано: {selectedTime}
        </div>
      )}
    </div>
  );
};

export default TimeSlotGrid;
