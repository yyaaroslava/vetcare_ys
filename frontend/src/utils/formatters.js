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
