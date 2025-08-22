// js/main.js
import * as api from './modules/api.js';
import * as productsModule from './modules/products.js';
import { Cart } from './modules/cart.js';
import * as inventory from './modules/inventory.js';
import * as ui from './modules/ui.js';
import * as validators from './modules/validators.js';
import * as checkout from './modules/checkout.js';
import * as invoice from './modules/invoice.js'; //Para la factura

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Inicializar persistencia (si no hay productos en localStorage, los carga desde data/products.json)
    await api.init();

    // Cargar catálogo desde la "API" (localStorage)
    await productsModule.loadProducts();

    // Crear/recuperar carrito (persistido en localStorage)
    const cart = new Cart();

    // Inicializar la UI — le pasamos instancias y módulos necesarios
    ui.init({
      productsModule,
      cart,
      inventory,
      api,
      validators,
      checkout,
      invoice //Se pasa invoice para que la factura sea usada en ui, entonces ui.js tendrá la factura disponible
    });

    // Render inicial
    const allProducts = productsModule.getAll();
    ui.renderProducts(allProducts);
    ui.renderCart(); // muestra contenido del carrito si existe
  } catch (err) {
    console.error('Error inicializando la app:', err);
    alert('Ocurrió un error al iniciar la aplicación. Revisa la consola.');
  }
});
