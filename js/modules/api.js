//claves para localstorage. Se coloca versión (_v1) para facilitar migraciones futuras si es requerrido
const PRODUCTS_KEY = 'mt_store_products_v1';
const ORDERS_KEY = 'mt_store_orders_v1';
const CART_KEY = 'mt_store_cart_v1';

/*inicializa persistencia. Si no existen productos en localStorage, los carga desde data/products.json mediante fetch (asincrono) y los guarda. Crea arreglos vacíos para "orders" y "carrito" si no existen*/
export async function init() {
  if (!localStorage.getItem(PRODUCTS_KEY)) {
    //fetch con cache 'no-store' fuerza revalidación en algunos navegadores (ayuda para el desarrollo)
    const res = await fetch('data/products.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar data/products.json');
    const products = await res.json();
    saveProducts(products);
  }
  //asegura que existan las claves (key) para órdenes y carrito
  if (!localStorage.getItem(ORDERS_KEY)) localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(CART_KEY)) localStorage.setItem(CART_KEY, JSON.stringify({ items: [] }));
}

/*funciones relacionadas con los productos*/

//devuelve el array de productos desde localstorage (parseado a tipo JSON)
export function getProducts() {
  const raw = localStorage.getItem(PRODUCTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

//guarda el array de productos en localStorage (stringify)
export function saveProducts(productsArray) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productsArray));
}

//buscar un producto por su "id" (convergencia exacta). Retorna el objeto o el valor de null
export function getProductById(id) {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
}

//actualiza un producto, busca por "id" y reemplaza el objeto, guarda y retorna true si tuvo éxito
export function updateProduct(product) {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    products[idx] = product;
    saveProducts(products);
    return true;
  }
  return false; //Cuando el producto no es encontrado
}

/*persistencia del carrito (persistencia simple)*/
//leer el carrito desde el navegador, gracias al localStorage
export function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : { items: [] };
}
//guarda el carrito (objeto) en el localstorage
export function saveCart(cartObj) {
  localStorage.setItem(CART_KEY, JSON.stringify(cartObj));
}
//limpiar carrito (resetear a la estructura vacía)
export function clearCart() {
  saveCart({ items: [] });
}

/*órdenes o pedidos*/
//guardar una orden, lee el array actual, empuja la orden y vuelve a guardar
export function saveOrder(orderObj) {
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  orders.push(orderObj);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}
//obtiene todas las órdenes guardadas
export function getOrders() {
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
}
