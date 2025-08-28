/*módulo para generar y mostrar la factura (invoice) en un modal Bootstrap
  recibe una `order` con esta forma esperada:
   {
     id: 'ORD-...',
     createdAt: 'ISO date',
     customer: { name, email, address },
     items: [ { id, qty, price, lineTotal, ... } ],
     totals: { subtotal, tax, total }
   } */

/*formatear valores monetarios y generar el HTML de una factura o recibo a partir de
un objeto `order` (por ejemplo, lo producido por cart.toOrder())
muestra la factura en el modal `#invoiceModal` del index.html usando Bootstrap
el módulo usa `innerHTML` para inyectar el HTML generado. Para evitar problemas, cada campo
dinámico pasa por `escapeHtml()` antes de insertarse
`formatCurrency` usa `Intl.NumberFormat` configurado con 'en-US' y USD */

//formatea números a moneda usando Intl API
export function formatCurrency(value) {
  //se ajusta locale y currency a lo que se necesita
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

/*genera el HTML completo de la factura
  order: objeto que incluye id, createdAt, customer, items[], totals
  devuelve un string con la tabla y bloques de totales */
function generateInvoiceHTML(order) {
  //convierte la fecha ISO a cadena legible según el locale del navegador
  const date = new Date(order.createdAt).toLocaleString();

  //encabezado cliente / orden
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

  //por cada línea del pedido se añade una fila a la tabla. Todos los valores dinámicos pasan por escapeHtml o formatCurrency para evitar inyección y para presentar moneda
  order.items.forEach((it, idx) => {
    const name = it.name || it.id || ''; //nombre del producto (fallbacks)
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

  //bloque para totales y mensajes
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

/*escapa caracteres especiales para intentar evitar inyección en innerHTML por datos no confiables */
function escapeHtml(str) {
  //si str es null/undefined y no es exactamente 0, se devuelve cadena vacía
  if (!str && str !== 0) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/*show(order) inyecta la factura en el DOM y muestra el modal
  se normaliza items y totales (por si faltan campos)
  requiere que exista un elemento con id #invoiceContent y #invoiceModal en index.html */
export function show(order) {
  const el = document.getElementById('invoiceContent');
  if (!el) {
    console.error('invoice.show: no se encontró #invoiceContent');
    return;
  }

//normaliza items, asegura name, price, qty y lineTotal con valores numéricos válidos
  const itemsNormalized = (order.items || []).map((it) => ({
    ...it,
    name: it.name || it.productName || it.id,
    price: Number(it.price || 0),
    qty: Number(it.qty || 0),
    lineTotal: Number(it.lineTotal ?? Number(it.price || 0) * Number(it.qty || 0)),
  }));

  //copia del order con items normalizados y totales calculados si faltan
  const orderCopy = {
    ...order,
    items: itemsNormalized,
    totals: order.totals || {
      subtotal: itemsNormalized.reduce((s, i) => s + i.lineTotal, 0),
      tax: 0,
      total: itemsNormalized.reduce((s, i) => s + i.lineTotal, 0),
    },
  };

  //generar HTML seguro y colocarlo en el contenedor
  el.innerHTML = generateInvoiceHTML(orderCopy);

  //muestra modal via Bootstrap
  const modalEl = document.getElementById('invoiceModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  //nota, el botón "Seguir comprando" en el modal ya tiene data-bs-dismiss, por eso ya no se manipula aqui
}
