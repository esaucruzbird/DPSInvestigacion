/*orquesta la inicialización de la "app" al cargar la página.
  carga datos (persistencia con la API falsa), instancia el carrito, inicializa la UI
  separa responsabilidades delegando en módulos (api, products, cart, ui, etc.) */

//importaciones de módulos (cada uno encapsula lógica específica)
import * as api from './modules/api.js';
import * as productsModule from './modules/products.js';
import { Cart } from './modules/cart.js';
import * as inventory from './modules/inventory.js';
import * as ui from './modules/ui.js';
import * as validators from './modules/validators.js';
import * as checkout from './modules/checkout.js';
import * as invoice from './modules/invoice.js'; //Para la factura

//se espera a que el DOM esté listo antes de manipular elementos y arrancar la app como tal
document.addEventListener('DOMContentLoaded', async () => {
  try {
    //inicializar persistencia (si no hay productos en localStorage, los carga desde data/products.json)
    //api.init() puede comprobar si ya existe un dataset en localStorage
    //este paso mantiene la app independiente de una API remota real (útil para pruebas locales y tests).
    await api.init();

    //carga el catálogo en memoria, desde la "API" (en el localStorage del navegador)
    //productsModule.loadProducts() debería leer los productos almacenados, lo que dejó api.init en localStorage
    await productsModule.loadProducts();

    //crear o recuperar instancia del carrito (persistido en localStorage)
    //la clase Cart encapsula la lógica de agregar, eliminar, persistir y calcular totales
    const cart = new Cart();

    //inicializar la UI, se le pasa (instancia) los módulos u objetos necesarios
    //ui.init recibe un objeto con las dependencias necesarias
    ui.init({
      productsModule,
      cart,
      inventory,
      api,
      validators,
      checkout,
      invoice //Se pasa invoice para que la factura sea usada en ui, entonces ui.js tendrá la factura disponible
    });

    //render inicial, obtiene todos los productos y los dibuja en la pantalla
    //productsModule.getAll() devuelve el array de productos que está cargado actualmente
    const allProducts = productsModule.getAll();
    //ui.renderProducts se encarga de clonar el template, rellenar datos y agregar listeners
    ui.renderProducts(allProducts);
    //render del carrito, si el usuario tenía items guardados, serán mostrados en el offcanvas
    ui.renderCart(); // muestra contenido del carrito si existe
    //captura errores en cualquier paso de la inicialización, para evitar dejar una página vacía
  } catch (err) {
    console.error('Error inicializando la app:', err);
    alert('Ocurrió un error al iniciar la aplicación. Revisa la consola.');
  }
});
