// js/modules/validators.js
export function isPositiveInteger(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

export function isNonNegativeInteger(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0;
}

export function isEmail(value) {
  if (!value || typeof value !== 'string') return false;
  return /^\S+@\S+\.\S+$/.test(value.trim());
}
