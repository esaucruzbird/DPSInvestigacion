import * as api from './api.js';

let _productsCache = [];

export async function loadProducts() {
  _productsCache = api.getProducts();
  return _productsCache;
}

export function getAll() {
  return _productsCache.map(p => ({ ...p }));
}

export function getById(id) {
  return _productsCache.find(p => p.id === id) || null;
}

export function filter({ q = '', category = '' } = {}) {
  const qLower = q.trim().toLowerCase();
  return _productsCache.filter(p => {
    if (category && p.category !== category) return false;
    if (!qLower) return true;
    return (p.name + ' ' + (p.description || '') + ' ' + (p.sku || '')).toLowerCase().includes(qLower);
  });
}

export function updateProductLocally(updated) {
  const idx = _productsCache.findIndex(p => p.id === updated.id);
  if (idx >= 0) {
    _productsCache[idx] = { ...updated };
    api.updateProduct(updated);
    return true;
  }
  return false;
}
