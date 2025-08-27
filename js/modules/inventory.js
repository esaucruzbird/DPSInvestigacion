import * as api from './api.js';

export function getStock(productId) {
  const p = api.getProductById(productId);
  return p ? (Number.isInteger(p.stock) ? p.stock : 0) : null;
}

export function isAvailable(productId, qty) {
  const stock = getStock(productId);
  if (stock === null) return false;
  return Number(qty) > 0 && Number(qty) <= stock;
}

export function decrementStock(items = []) {
  const products = api.getProducts();
  const result = [];

  for (const item of items) {
    const prodIdx = products.findIndex(p => p.id === item.id);
    if (prodIdx === -1) {
      result.push({ id: item.id, ok: false, reason: 'no_existe' });
      continue;
    }
    const current = products[prodIdx];
    if (item.qty > current.stock) {
      result.push({ id: item.id, ok: false, reason: 'stock_insuficiente', available: current.stock });
      continue;
    }
    current.stock = current.stock - item.qty;
    result.push({ id: item.id, ok: true });
  }

  api.saveProducts(products);
  return {
    success: result.every(r => r.ok),
    details: result
  };
}

export function incrementStock(items = []) {
  const products = api.getProducts();
  for (const item of items) {
    const prod = products.find(p => p.id === item.id);
    if (prod) {
      prod.stock = (prod.stock || 0) + Number(item.qty || 0);
    }
  }
  api.saveProducts(products);
}

export function setStock(productId, newStock) {
  const products = api.getProducts();
  const prod = products.find(p => p.id === productId);
  if (!prod) return false;
  prod.stock = Number(newStock);
  api.saveProducts(products);
  return true;
}
