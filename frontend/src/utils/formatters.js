/**
 * Функція форматування віку тварини (роки + місяці) з правильними закінченнями.
 * @param {string} birthDateStr - Дата народження у форматі ISO
 * @returns {string} - Відформатований рядок віку
 */
export function formatAge(birthDateStr) {
  if (!birthDateStr) return '—';
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  
  if (years < 0) return 'Ще не народився';
  if (years === 0 && months === 0) return 'Менше місяця';
  
  if (years === 0) {
    if (months === 1) return '1 місяць';
    if (months >= 2 && months <= 4) return `${months} місяці`;
    return `${months} місяців`;
  }
  
  let yearStr = 'років';
  const lastDigit = years % 10;
  if (years % 100 >= 11 && years % 100 <= 14) yearStr = 'років';
  else if (lastDigit === 1) yearStr = 'рік';
  else if (lastDigit >= 2 && lastDigit <= 4) yearStr = 'роки';
  
  return `${years} ${yearStr}`;
}

/**
 * Перетворює дату ISO (2023-12-31) у формат DD.MM.YYYY
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Перетворює час (14:30:00) у формат HH:MM
 */
export function formatTime(timeStr) {
  if (!timeStr) return '—';
  return timeStr.split(':').slice(0, 2).map(x => x.padStart(2, '0')).join(':');
}

/**
 * Витягує масив даних із відповіді API (підтримує пагіновані та звичайні відповіді).
 * Замінює повторюваний патерн: response.data.results || response.data
 * @param {object} response - Відповідь Axios
 * @returns {Array} - Масив даних
 */
export function extractData(response) {
  return response.data.results || response.data;
}
