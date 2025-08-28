//revalidar stock antes de procesar la orden, decrementar stock y persistir la orden

//lógica para checkout (revalidaciones y procesamiento).
//dependencias, inventory para stock y api para persistencia de órdenes
import * as inventory from './inventory.js';
import * as api from './api.js';

/*valida si los items del carrito tienen stock suficiente
 @param {Array} items [{id, qty}]
 @returns {Object} { ok: boolean, details: [{id, ok, available?}] } */
export function validateStock(items = []) {
  const details = [];
  let ok = true;
  //para cada item consulta el stock actual y registra el resultado en details
  for (const it of items) {
    const available = inventory.getStock(it.id);
    //available === null indica que el producto no existe
    if (available === null || it.qty > available) {
      ok = false; //si alguno falla, ok global debe ser false
      details.push({ id: it.id, ok: false, available });
    } else {
      details.push({ id: it.id, ok: true });
    }
  }
  return { ok, details };
}

/*procesa una orden: revalida, decrementa stock y persiste la orden.
  @param {Object} order (forma generada por cart.toOrder)
  @returns {Object} { success: boolean, reason?: string, details?: any } */
export function processOrder(order) {
  const items = order.items || [];
  //revalidar stock antes de tocar nada, esto reduce la probabilidad de conflicto
  const validation = validateStock(items);
  if (!validation.ok) {
    return { success: false, reason: 'stock_conflict', details: validation.details };
  }

  //intenta decrementar stock. inventory.decrementStock intenta aplicar los cambios y devuelve un resumen por item en `details` y `success` si todos los items pudieron decrementar
  const dec = inventory.decrementStock(items);
  if (!dec.success) {
    //se devuelve el fallo y se deja el estado tal cual
    return { success: false, reason: 'decrement_failed', details: dec.details };
  }

  //persistir la orden en localstorage (o backend si fuera ya la vida real)
  api.saveOrder(order);

  return { success: true, orderId: order.id };
}
