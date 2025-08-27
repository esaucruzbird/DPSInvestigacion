//lógica de negocio ligera para checkout (revalidaciones y procesamiento).
import * as inventory from './inventory.js';
import * as api from './api.js';

/**
 * Valida si los items del carrito tienen stock suficiente.
 * @param {Array} items [{id, qty}]
 * @returns {Object} { ok: boolean, details: [{id, ok, available?}] }
 */
export function validateStock(items = []) {
  const details = [];
  let ok = true;
  for (const it of items) {
    const available = inventory.getStock(it.id);
    if (available === null || it.qty > available) {
      ok = false;
      details.push({ id: it.id, ok: false, available });
    } else {
      details.push({ id: it.id, ok: true });
    }
  }
  return { ok, details };
}

/**
 * Procesa una orden: revalida, decrementa stock y persiste la orden.
 * @param {Object} order (forma generada por cart.toOrder)
 * @returns {Object} { success: boolean, reason?: string, details?: any }
 */
export function processOrder(order) {
  const items = order.items || [];
  const validation = validateStock(items);
  if (!validation.ok) {
    return { success: false, reason: 'stock_conflict', details: validation.details };
  }

  // Decrementar stock
  const dec = inventory.decrementStock(items);
  if (!dec.success) {
    return { success: false, reason: 'decrement_failed', details: dec.details };
  }

  // Guardar orden
  api.saveOrder(order);

  return { success: true, orderId: order.id };
}
