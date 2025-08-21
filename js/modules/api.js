// js/modules/api.js
const PRODUCTS_KEY = 'mt_store_products_v1';
const ORDERS_KEY = 'mt_store_orders_v1';
const CART_KEY = 'mt_store_cart_v1';

/**
 * Inicializa persistencia:
 * - Si no existen productos en localStorage, los carga desde data/products.json
 */
export async function init() {
  if (!localStorage.getItem(PRODUCTS_KEY)) {
    const res = await fetch('data/products.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar data/products.json');
    const products = await res.json();
    saveProducts(products);
  }
  if (!localStorage.getItem(ORDERS_KEY)) localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(CART_KEY)) localStorage.setItem(CART_KEY, JSON.stringify({ items: [] }));
}

/** Productos */
export function getProducts() {
  const raw = localStorage.getItem(PRODUCTS_KEY);
  return raw ? JSON.parse(raw) : [];
}
export function saveProducts(productsArray) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productsArray));
}
export function getProductById(id) {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
}
export function updateProduct(product) {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    products[idx] = product;
    saveProducts(products);
    return true;
  }
  return false;
}

/** Carrito (persistencia simple) */
export function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : { items: [] };
}
export function saveCart(cartObj) {
  localStorage.setItem(CART_KEY, JSON.stringify(cartObj));
}
export function clearCart() {
  saveCart({ items: [] });
}

/** Pedidos / órdenes */
export function saveOrder(orderObj) {
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  orders.push(orderObj);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}
export function getOrders() {
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
}
