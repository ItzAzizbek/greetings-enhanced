// Birthdays are stored as YYYY-MM-DD strings. Year is preserved (useful
// for an "age" readout later) but matching only ever compares MM-DD.

const FULL = /^\d{4}-\d{2}-\d{2}$/;

export function parseBirthday(input) {
  if (input == null) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  if (!FULL.test(trimmed)) return { error: 'Use YYYY-MM-DD.' };
  const [y, m, d] = trimmed.split('-').map(Number);
  // Real-date sanity check (catches 2026-02-31, etc.)
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return { error: 'Not a real date.' };
  }
  return { value: trimmed };
}

export function isBirthdayToday(birthday, atMs = Date.now()) {
  if (!birthday || !FULL.test(birthday)) return false;
  const d = new Date(atMs);
  const today = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  return birthday.slice(5) === today;
}

export function birthdayYearKey(atMs = Date.now()) {
  return new Date(atMs).getFullYear();
}
