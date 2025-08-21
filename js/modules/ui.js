// js/modules/ui.js
// Render del DOM y manejo de UI, usando Bootstrap Offcanvas, Modal y Toast.
// Recibe en init un objeto con dependencias: productsModule, cart, inventory, api, validators, checkout.

let dependencies = null;
let cartOffcanvas = null;
let checkoutModal = null;

/* Helpers */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function formatCurrency(value) {
  //Para ajustar la localización/moneda de las cantidades de dinero 'en-US' y 'USD'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}


export function init(deps) {
  dependencies = deps;

  // Inicializar Bootstrap components (depende de bootstrap.bundle.js cargado)
  const cartEl = document.getElementById('cartSidebar');
  const modalEl = document.getElementById('checkoutModal');
  cartOffcanvas = new bootstrap.Offcanvas(cartEl);
  checkoutModal = new bootstrap.Modal(modalEl);

  // Botones principales
  $('#openCartBtn').addEventListener('click', () => openCart());
  $('#closeCartBtn').addEventListener('click', () => closeCart());
  $('#checkoutBtn').addEventListener('click', () => openCheckoutModal());

  // Cerrar modal
  $('#closeCheckoutBtn').addEventListener('click', () => closeCheckoutModal());
  $('#cancelCheckoutBtn').addEventListener('click', () => closeCheckoutModal());

  // Search + filter
  $('#searchInput').addEventListener('input', handleSearchInput);
  $('#categoryFilter').addEventListener('change', handleCategoryChange);

  // Events from cart changes
  document.addEventListener('cart:updated', () => {
    renderCart();
    renderCartCount();
  });

  // Checkout form
  $('#checkoutForm').addEventListener('submit', handleCheckoutSubmit);

  // Initial cart count
  renderCartCount();
}

/**
 * Renderiza productos dentro de la grid de bootstrap.
 * Cada tarjeta va dentro de una columna col-*
 */
export function renderProducts(products = []) {
  const grid = $('#productsGrid');
  grid.innerHTML = '';

  const template = document.getElementById('product-card-template');

  products.forEach((prod) => {
    // crear columna
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-md-4 col-lg-3';

    const node = template.content.cloneNode(true);
    const card = node.querySelector('.product-card');
    const img = node.querySelector('.product-image');
    const name = node.querySelector('.product-name');
    const desc = node.querySelector('.product-desc');
    const price = node.querySelector('.product-price');
    const stock = node.querySelector('.product-stock');
    const qtyInput = node.querySelector('.qty-input');
    const addBtn = node.querySelector('.btn-add');

    img.src = prod.image || 'https://via.placeholder.com/400x300';
    img.alt = prod.name;
    name.textContent = prod.name;
    desc.textContent = prod.description || '';
    price.textContent = `$${Number(prod.price).toFixed(2)}`;
    stock.textContent = `Stock: ${prod.stock}`;

    if (!prod.stock || prod.stock <= 0) {
      addBtn.disabled = true;
      addBtn.textContent = 'Agotado';
      qtyInput.disabled = true;
    }

    addBtn.dataset.productId = prod.id;

    addBtn.addEventListener('click', () => {
      const qty = Number(qtyInput.value);
      const res = dependencies.cart.addItem(prod.id, qty);
      if (!res.success) {
        if (res.reason === 'stock_insuficiente') {
          showToast(`No hay suficiente stock. Disponible: ${res.available ?? '0'}`);
        } else if (res.reason === 'cantidad_invalida') {
          showToast('Cantidad inválida. Debe ser un entero positivo.');
        } else {
          showToast('No se pudo agregar el producto.');
        }
      } else {
        showToast('Producto añadido al carrito.');
        // Reiniciar solo el input asociado a esta tarjeta
        if (!qtyInput.disabled) qtyInput.value = 1;

        //Actualizando UI del carrito
        renderCart();
        renderCartCount();
      }
    });

    col.appendChild(node);
    grid.appendChild(col);
  });
}

/** Render del carrito */
/*export function renderCart() {
  const cartItemsContainer = $('#cartItems');
  cartItemsContainer.innerHTML = '';

  const items = dependencies.cart.getItems();
  if (items.length === 0) {
    cartItemsContainer.innerHTML = '<p class="text-muted">El carrito está vacío.</p>';
  } else {
    const products = dependencies.productsModule.getAll();
    items.forEach((item) => {
      const p = products.find((x) => x.id === item.id);

      const div = document.createElement('div');
      div.className = 'cart-item d-flex align-items-center justify-content-between';
      div.innerHTML = `
        <div class="ci-left">
          <strong>${p ? p.name : item.id}</strong>
          <div class="small">Precio: $${p ? Number(p.price).toFixed(2) : '0.00'}</div>
        </div>
        <div class="ci-right d-flex align-items-center gap-2">
          <input type="number" min="0" value="${item.qty}" data-cart-id="${
        item.id
      }" class="form-control form-control-sm cart-qty-input" style="width:5rem;" />
          <button data-remove-id="${item.id}" class="btn btn-sm btn-outline-danger btn-remove">Eliminar</button>
        </div>
      `;
      cartItemsContainer.appendChild(div);
    });

    // listeners
    $$('.cart-qty-input').forEach((inp) => {
      inp.addEventListener('change', (ev) => {
        const id = ev.target.dataset.cartId;
        const newQty = Number(ev.target.value);
        const res = dependencies.cart.updateQuantity(id, newQty);
        if (!res.success) {
          if (res.reason === 'stock_insuficiente') {
            showToast('Stock insuficiente para esa cantidad.');
            const prev = dependencies.cart.getQty(id);
            ev.target.value = prev;
          } else {
            showToast('Cantidad inválida.');
            const prev = dependencies.cart.getQty(id);
            ev.target.value = prev;
          }
        } else {
          renderCart(); // re-render para totales
          renderCartCount();
        }
      });
    });

    $$('.btn-remove').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        const id = ev.target.dataset.removeId;
        dependencies.cart.removeItem(id);
        renderCart();
        renderCartCount();
      });
    });
  }

  // totales
  $('#cartSubtotal').textContent = `$${dependencies.cart.getSubtotal().toFixed(2)}`;
  $('#cartTax').textContent = `$${dependencies.cart.getTax().toFixed(2)}`;
  $('#cartTotal').textContent = `$${dependencies.cart.getTotal().toFixed(2)}`;

  renderCartCount();
}*/

export function renderCart() {
  const cartItemsContainer = $('#cartItems');
  cartItemsContainer.innerHTML = '';

  const items = dependencies.cart.getItems();
  if (items.length === 0) {
    cartItemsContainer.innerHTML = '<p class="text-muted">El carrito está vacío.</p>';
  } else {
    const products = dependencies.productsModule.getAll();
    items.forEach((item) => {
      const p = products.find((x) => x.id === item.id);

      // calcular precio unitario y total por línea
      const unitPrice = p ? Number(p.price) : 0;
      const qty = Number(item.qty);
      const lineTotal = unitPrice * qty;

      const div = document.createElement('div');
      div.className = 'cart-item d-flex align-items-center justify-content-between';
      div.style.gap = '.75rem';
      div.innerHTML = `
        <div class="ci-left">
          <strong>${p ? p.name : item.id}</strong>
          <div class="small">Precio unitario: $${unitPrice.toFixed(2)}</div>
          <div class="small text-muted">Total artículo: <span class="item-line-total fw-bold">$${lineTotal.toFixed(2)}</span></div>
        </div>
        <div class="ci-right d-flex align-items-center gap-2">
          <input type="number" min="0" value="${item.qty}" data-cart-id="${item.id}" class="form-control form-control-sm cart-qty-input" style="width:5rem;" />
          <button data-remove-id="${item.id}" class="btn btn-sm btn-outline-danger btn-remove">Eliminar</button>
        </div>
      `;
      cartItemsContainer.appendChild(div);
    });

    // listeners para inputs de cantidad
    $$('.cart-qty-input').forEach((inp) => {
      inp.addEventListener('change', (ev) => {
        const id = ev.target.dataset.cartId;
        const newQtyRaw = ev.target.value;
        const newQty = Number(newQtyRaw);

        // intentar actualizar cantidad en cart (cart.updateQuantity hará validaciones)
        const res = dependencies.cart.updateQuantity(id, newQty);

        if (!res.success) {
          // Mostrar mensaje específico según reason (si se proporciona)
          if (res.reason === 'stock_insuficiente') {
            showToast('Stock insuficiente para esa cantidad.');
          } else if (res.reason === 'cantidad_invalida') {
            showToast('Cantidad inválida. Introduzca un entero mayor o igual a 0.');
          } else if (res.reason === 'no_en_carrito') {
            showToast('El artículo no se encontró en el carrito.');
          } else {
            showToast('No se pudo actualizar la cantidad.');
          }

          // --- Sincronizar UI completa con el estado real (re-render) ---
          // Esto garantiza que la vista refleje exactamente la "fuente de verdad"
          renderCart();
          renderCartCount();
          return; // salir del handler para evitar más acciones en este callback
        }

        // éxito: re-render para actualizar line totals y totales generales
        renderCart();
        renderCartCount();
      });
    });

    // listeners para botones eliminar
    $$('.btn-remove').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        const id = ev.target.dataset.removeId;
        dependencies.cart.removeItem(id);
        renderCart();
        renderCartCount();
      });
    });
  }

  // totales generales
  $('#cartSubtotal').textContent = `$${dependencies.cart.getSubtotal().toFixed(2)}`;
  $('#cartTax').textContent = `$${dependencies.cart.getTax().toFixed(2)}`;
  $('#cartTotal').textContent = `$${dependencies.cart.getTotal().toFixed(2)}`;

  renderCartCount();
}


/** Contador en header */
export function renderCartCount() {
  const countEl = $('#cartCount');
  const totalItems = dependencies.cart.getItems().reduce((s, it) => s + Number(it.qty), 0);
  countEl.textContent = totalItems;
}

/** Offcanvas control */
export function openCart() {
  if (cartOffcanvas) cartOffcanvas.show();
}
export function closeCart() {
  if (cartOffcanvas) cartOffcanvas.hide();
}

/** Modal control */
export function openCheckoutModal() {
  if (dependencies.cart.getItems().length === 0) {
    showToast('El carrito está vacío.');
    return;
  }
  if (checkoutModal) checkoutModal.show();
}
export function closeCheckoutModal() {
  if (checkoutModal) checkoutModal.hide();
}

/** Toasts (Bootstrap) */
export function showToast(message, ttl = 3000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = 1200;
    document.body.appendChild(container);
  }

  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.setAttribute('aria-atomic', 'true');
  toastEl.innerHTML = `
    <div class="toast-header">
      <strong class="me-auto">MiTienda</strong>
      <small class="text-muted">ahora</small>
      <button type="button" class="btn-close ms-2 mb-1" data-bs-dismiss="toast" aria-label="Cerrar"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;

  container.appendChild(toastEl);

  const toast = new bootstrap.Toast(toastEl, { delay: ttl });
  toast.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

/** Handlers para filtros */
function handleSearchInput(ev) {
  const q = ev.target.value;
  const category = $('#categoryFilter').value;
  const filtered = dependencies.productsModule.filter({ q, category });
  renderProducts(filtered);
}

function handleCategoryChange(ev) {
  const category = ev.target.value;
  const q = $('#searchInput').value;
  const filtered = dependencies.productsModule.filter({ q, category });
  renderProducts(filtered);
}

/** Manejo del submit del checkout: revalidar y procesar orden */
function handleCheckoutSubmit(ev) {
  ev.preventDefault();
  const form = ev.target;
  const fd = new FormData(form);
  const customer = {
    name: (fd.get('customerName') || '').trim(),
    email: (fd.get('customerEmail') || '').trim(),
    address: (fd.get('customerAddress') || '').trim(),
  };

  const errors = [];
  if (!customer.name) errors.push('Nombre requerido.');
  if (!dependencies.validators.isEmail(customer.email)) errors.push('Email inválido.');
  if (!customer.address) errors.push('Dirección requerida.');

  const errBox = $('#checkoutErrors');
  errBox.innerHTML = '';
  if (errors.length) {
    errBox.innerHTML = errors.map((e) => `<div>${e}</div>`).join('');
    return;
  }

  // Revalidar stock via checkout.validateStock
  const items = dependencies.cart.getItems();
  const validation = dependencies.checkout.validateStock(items);
  if (!validation.ok) {
    showToast('Algunos productos no cuentan con stock suficiente. Actualice el carrito.');
    // Puedes mostrar detalles concretos
    return;
  }

  // Crear orden, procesar
  const order = dependencies.cart.toOrder(customer);
  const result = dependencies.checkout.processOrder(order);
  if (!result.success) {
    showToast('Error al procesar la orden. Intenta nuevamente.');
    return;
  }

  // Vaciar carrito
  dependencies.cart.clear();

  // Actualizar UI
  closeCheckoutModal();
  closeCart();
  renderProducts(dependencies.productsModule.getAll());
  renderCart();
  showToast('Compra confirmada. Gracias por su compra.');
}
