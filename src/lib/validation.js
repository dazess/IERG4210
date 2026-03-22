export const MAX_QTY = 999;

function stripControlChars(value) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, '');
}

function stripUnsafeUnicodeSeparators(value) {
  return value.replace(/[\u2028\u2029]/g, '');
}

export function sanitizeSingleLineInput(value, maxLength = 255) {
  return stripUnsafeUnicodeSeparators(stripControlChars(value))
    .replace(/\s+/g, ' ')
    .slice(0, maxLength)
    .trimStart();
}

export function sanitizeDescriptionInput(value, maxLength = 1000) {
  return stripUnsafeUnicodeSeparators(stripControlChars(value))
    .replace(/\r\n/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .slice(0, maxLength)
    .trimStart();
}

export function sanitizeDisplayText(value, maxLength = 255) {
  return stripUnsafeUnicodeSeparators(stripControlChars(value))
    .replace(/\s+/g, ' ')
    .slice(0, maxLength)
    .trim();
}

export function sanitizeImageIdForPath(value) {
  const raw = String(value ?? '').trim();
  if (!/^\d+$/.test(raw)) return '';
  return raw;
}

export function normalizeMoneyInput(value) {
  const raw = stripControlChars(value).trim();
  if (raw === '') return '';
  if (!/^\d{0,8}(\.\d{0,2})?$/.test(raw)) return null;
  return raw;
}

export function clampQuantityInput(value, fallback = 1, max = MAX_QTY) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1, parsed));
}
