/*mantiene un cache, en memoria, de los productos cargados desde api.js que deposita en localstorage
provee funciones para leer, filtrar y actualizar productos en memoria
este módulo asume que api.init() ya fue ejecutado y que api.getProducts() devolverá datos.*/

import * as api from './api.js';

//caché en memoria, evita leer continuamente localstorage, mejorando el rendimiento
let _productsCache = [];

//carga productos en memoria desde api.getProducts() se deja async por compatibilidad paratener await en main.js
export async function loadProducts() {
  _productsCache = api.getProducts();
  return _productsCache;
}

//devuelve una copia del array de productos
export function getAll() {
  return _productsCache.map(p => ({ ...p }));
}

//devuelve el producto por id, devuelve la referencia almacenada en el cache
export function getById(id) {
  return _productsCache.find(p => p.id === id) || null;
}

//filtrado simple de productos por cadena de búsqueda (q) y categoría.
//q es el texto que se busca en nombre, descripción o sku
//category, si es enviado, filtra por igualdad estricta del campo product.category
export function filter({ q = '', category = '' } = {}) {
  const qLower = q.trim().toLowerCase();
  return _productsCache.filter(p => {
    //si se especificó categoría y no coincide, se excluye
    if (category && p.category !== category) return false;
    //si no hay query, el producto pasa el filtro por texto
    if (!qLower) return true;
    //concatena los campos relevantes y busca la subcadena
    return (p.name + ' ' + (p.description || '') + ' ' + (p.sku || '')).toLowerCase().includes(qLower);
  });
}

//actualiza un producto en el cache y lo persiste mediante api.updateProduct
//se sustituye el objeto entero en la posición encontrada y retorna true si tuvo éxito, false si no se encontró el producto
export function updateProductLocally(updated) {
  const idx = _productsCache.findIndex(p => p.id === updated.id);
  if (idx >= 0) {
    //guardar copia en el cache
    _productsCache[idx] = { ...updated };
    //persistir el cambio en la API (localstorage)
    api.updateProduct(updated);
    return true;
  }
  return false;
}
