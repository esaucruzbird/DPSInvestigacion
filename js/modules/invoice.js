// js/modules/invoice.js
/**
 * Módulo para generar y mostrar la factura (invoice) en un modal Bootstrap.
 * Recibe una `order` con esta forma esperada:
 * {
 *   id: 'ORD-...',
 *   createdAt: 'ISO date',
 *   customer: { name, email, address },
 *   items: [ { id, qty, price, lineTotal, ... } ],
 *   totals: { subtotal, tax, total }
 * }
 */

export function formatCurrency(value) {
  // Ajusta locale y currency si lo necesitas
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

/** Genera la tabla HTML de items y el bloque de totales */
function generateInvoiceHTML(order) {
  const date = new Date(order.createdAt).toLocaleString();

  // encabezado cliente / orden
  let html = `
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-md-6">
          <h6>Factura: <small class="text-muted">${order.id}</small></h6>
          <div>Fecha: ${date}</div>
        </div>
        <div class="col-md-6 text-md-end">
          <h6>Cliente</h6>
          <div><strong>${escapeHtml(order.customer.name)}</strong></div>
          <div>${escapeHtml(order.customer.email)}</div>
          <div class="small text-muted">${escapeHtml(order.customer.address)}</div>
        </div>
      </div>

      <div class="table-responsive mb-3">
        <table class="table table-sm table-bordered">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th class="text-end">Cantidad</th>
              <th class="text-end">Precio unitario</th>
              <th class="text-end">Total por producto</th>
            </tr>
          </thead>
          <tbody>
  `;

  order.items.forEach((it, idx) => {
    const name = it.name || it.id || '';
    const qty = Number(it.qty || 0);
    const price = Number(it.price || 0);
    const lineTotal = Number(it.lineTotal ?? price * qty);

    html += `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(name)}</td>
        <td class="text-end">${qty}</td>
        <td class="text-end">${formatCurrency(price)}</td>
        <td class="text-end">${formatCurrency(lineTotal)}</td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>

      <div class="row">
        <div class="col-md-6">
          <!-- Opcional: notas o política -->
          <div class="small text-muted">Gracias por su compra. Conserve este comprobante para futuras referencias.</div>
        </div>
        <div class="col-md-6">
          <table class="table table-sm">
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td class="text-end">${formatCurrency(order.totals.subtotal)}</td>
              </tr>
              <tr>
                <td>Impuesto</td>
                <td class="text-end">${formatCurrency(order.totals.tax)}</td>
              </tr>
              <tr class="fw-bold">
                <td>Total</td>
                <td class="text-end">${formatCurrency(order.totals.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return html;
}

/** Util: escapar HTML simple para evitar inyección por datos no confiables */
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Muestra la factura en el modal invoiceModal definido en index.html
 * @param {Object} order
 */
export function show(order) {
  const el = document.getElementById('invoiceContent');
  if (!el) {
    console.error('invoice.show: no se encontró #invoiceContent');
    return;
  }

  // Aseguramos que items tengan nombre y lineTotal (por si acaso)
  const itemsNormalized = (order.items || []).map((it) => ({
    ...it,
    name: it.name || it.productName || it.id,
    price: Number(it.price || 0),
    qty: Number(it.qty || 0),
    lineTotal: Number(it.lineTotal ?? Number(it.price || 0) * Number(it.qty || 0)),
  }));

  const orderCopy = {
    ...order,
    items: itemsNormalized,
    totals: order.totals || {
      subtotal: itemsNormalized.reduce((s, i) => s + i.lineTotal, 0),
      tax: 0,
      total: itemsNormalized.reduce((s, i) => s + i.lineTotal, 0),
    },
  };

  el.innerHTML = generateInvoiceHTML(orderCopy);

  // Mostrar modal via Bootstrap
  const modalEl = document.getElementById('invoiceModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  // Opcional: asignar comportamiento al botón "Seguir comprando" (ya cierra por data-bs-dismiss)
  // Si quieres alguna acción extra al cerrar puedes escuchar el evento hidden.bs.modal
}
