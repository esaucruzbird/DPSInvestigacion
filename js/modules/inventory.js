/*proveer utilidades para consultar y modificar el stock de productos
  trabaja sobre lo localizado en api.getProducts()/saveProducts (localstorage)
  las funciones  se persisten con api.saveProducts
*/

import * as api from './api.js';

//retorna el stock como número entero si el producto existe
//retorna 0 si el producto existe pero no tiene stock numérico entero definido
//retorna null si no existe el producto, es una clara separación entre "no existe" y "stock 0"
export function getStock(productId) {
  const p = api.getProductById(productId);
  //si no existe el producto devuelve null, indica "no encontrado"
  return p ? (Number.isInteger(p.stock) ? p.stock : 0) : null;
}

//verifica si la cantidad solicitada es válida y está disponible en el stock
//devuelve false si el producto no existe o si la cantidad pedida excede el rango permitido
export function isAvailable(productId, qty) {
  const stock = getStock(productId);
  if (stock === null) return false; //producto inexistente
  //convierte qty a número y valida el rango (mayor que 0 y menor o igual que el stock
  return Number(qty) > 0 && Number(qty) <= stock;
}

//items hace referencia a un array de objetos { id, qty }
//se intentan restar las cantidades especificadas al stock de los productos correspondientes
//se devuelve un objeto { success: boolean, details: Array } donde details indica por ítem si se obtuvo un OK
//persiste los productos actualizados en una única llamada a api.saveProducts(products)
export function decrementStock(items = []) {
  const products = api.getProducts(); //array en memoria (parseado)
  const result = [];

  for (const item of items) {
    //buscar índice del producto en el array (según id)
    const prodIdx = products.findIndex(p => p.id === item.id);
    if (prodIdx === -1) {
      //si no existe, se registra en detalles y continuar
      result.push({ id: item.id, ok: false, reason: 'no_existe' });
      continue;
    }
    const current = products[prodIdx];
    //validación del stock, si la cantidad solicitada supera el stock actual, registrar error
    if (item.qty > current.stock) {
      result.push({ id: item.id, ok: false, reason: 'stock_insuficiente', available: current.stock });
      continue;
    }
    //decrementar en el stock
    current.stock = current.stock - item.qty;
    result.push({ id: item.id, ok: true });
  }

  //persistir los cambios una sola vez para eficiencia
  api.saveProducts(products);
  //success es true solo si todos los items tuvieron ok === true
  return {
    success: result.every(r => r.ok),
    details: result
  };
}

//incrementa el stock para los productos listados, puede ser útil para devoluciones o rollback
export function incrementStock(items = []) {
  const products = api.getProducts();
  for (const item of items) {
    const prod = products.find(p => p.id === item.id);
    if (prod) {
      prod.stock = (prod.stock || 0) + Number(item.qty || 0);
    }
  }
  //persiste los productos al finalizar
  api.saveProducts(products);
}

//asigna el stock a un valor numérico para un producto dado
//retorna true si se encontró y actualizó el producto, false si no existe
export function setStock(productId, newStock) {
  const products = api.getProducts();
  const prod = products.find(p => p.id === productId);
  if (!prod) return false;
  prod.stock = Number(newStock);
  api.saveProducts(products);
  return true;
}
