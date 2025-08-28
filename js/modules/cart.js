/*encapsula la lógica del carrito de compras: agregar, actualizar cantidades, eliminar, calcular totales
persistencia en el estado del carrito mediante el módulo de api (localstorage)
emite eventos del DOM cuando el carrito cambia, para que la UI pueda reaccionar
esta clase asume que hay otros módulos disponibles: api (persistencia), inventory (stock), validators (validaciones)
emite un evento `cart:updated` con el detalle del carrito tras cada cambio hecho por el usuario
devuelve objetos para reportar fallos en operaciones.
*/

import * as api from './api.js';
import * as inventory from './inventory.js';
import * as validators from './validators.js';

export class Cart {
  constructor() {
    //al crear la instancia, recuperamos el carrito persistido desde el localstorage
    const persisted = api.getCart();
    //si persisted.items es un array, se clona con slice() para evitar referencias compartidas
    //si no existe o no es array, inicializamos un array vacío
    this.items = Array.isArray(persisted.items) ? persisted.items.slice() : [];
  }

  //guarda el estado actual del carrito en persistencia (localstorage vía api.saveCart)
  save() {
    api.saveCart({ items: this.items });
  }

  //obtiene una copia de los items
  getItems() {
    return this.items.map((i) => ({ ...i }));
  }

  //obtiene la cantidad de un producto en el carrito (o 0 si es que no está)
  getQty(productId) {
    const it = this.items.find((i) => i.id === productId);
    return it ? Number(it.qty) : 0;
  }

  //agrega un ítem al carrito
  addItem(productId, qty = 1) {
    //normaliza qty a número
    qty = Number(qty);
    //if (!Number.isInteger(qty) || qty <= 0) return { success: false, reason: 'cantidad_invalida' };
    //qty debe ser entero positivo (1,2,3...) se delega a validators.isPositiveInteger para mantener la validación centralizada
    if (!validators.isPositiveInteger(qty)) return { success: false, reason: 'cantidad_invalida' };

    //comprobar stock disponible mediante inventory.getStock(productId)
    //inventory.getStock retorna null si el producto no existe o un número si es que existe
    const available = inventory.getStock(productId);
    if (available === null) return { success: false, reason: 'producto_no_encontrado' };

    //cuánto hay actualmente en el carrito
    const currentInCart = this.getQty(productId);
    //si la suma excede el stock disponible, rechaza la operación e informa cuántos productos hay disponibles
    if (currentInCart + qty > available) return { success: false, reason: 'stock_insuficiente', available };

    //si el producto ya está en el carrito, se actualiza la cantidad; si no, se inserta el item nuevo
    const idx = this.items.findIndex((i) => i.id === productId);
    if (idx >= 0) {
      //sumar la cantidad, asumiendo que qty es un valor correcto o seguro
      this.items[idx].qty = this.items[idx].qty + qty;
    } else {
      //añadir nuevo objeto con el respectivo id y qty
      this.items.push({ id: productId, qty });
    }
    //guardando o ersistiendo los cambios en el carrito
    this.save();
    
    //emitir evento personalizado para notificar a la UI (u otros listeners) que el carrito cambió
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: this.getItems() } }));
    //retorna indicación de éxito. O también, se podría devolver el carrito ya actualizado
    return { success: true };
  }

  //actualizar la cantidad de un producto a newQty (permitiendo el valor de 0, a modo de eliminar)
  updateQuantity(productId, newQty) {
    newQty = Number(newQty);
    //if (!Number.isInteger(newQty) || newQty < 0) return { success: false, reason: 'cantidad_invalida' };
    //se debe permitir el "0" para eliminar y enteros positivos
    if (!validators.isNonNegativeInteger(newQty)) return { success: false, reason: 'cantidad_invalida' };

    //buscar índice del item en el carrito
    const idx = this.items.findIndex((i) => i.id === productId);
    if (idx === -1) return { success: false, reason: 'no_en_carrito' };

    //comprobando el stock actual, pudo haber cambiado desde que el usuario agregó el producto
    const available = inventory.getStock(productId);
    if (available === null) return { success: false, reason: 'producto_no_encontrado' };
    if (newQty > available) return { success: false, reason: 'stock_insuficiente', available };

    //si la nueva cantidad es 0, eliminamos el item; si no, se actualiza la cantidad
    if (newQty === 0) {
      this.items.splice(idx, 1);
    } else {
      this.items[idx].qty = newQty;
    }
    //guardar o persistir y emitir evento
    this.save();
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: this.getItems() } }));
    return { success: true };
  }

  //remover un ítem por su productId, se devuelve true si se eliminó algo
  removeItem(productId) {
    const idx = this.items.findIndex((i) => i.id === productId);
    if (idx >= 0) {
      this.items.splice(idx, 1);
      this.save();
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: this.getItems() } }));
      return true;
    }
    return false; // si no estaba en el carrito
  }

  //vaciar el carrito completamente
  clear() {
    this.items = [];
    this.save();
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: this.getItems() } }));
  }

  //calcular el subtotal (suma del price POR qty) consultando los productos desde api.getProducts()
  getSubtotal() {
    const apiProducts = api.getProducts();
    let subtotal = 0;
    for (const it of this.items) {
      //buscar el producto correspondiente para obtener su precio
      const prod = apiProducts.find((p) => p.id === it.id);
      if (prod) subtotal += Number(prod.price) * Number(it.qty);
    }
    //devuelve como Number para facilitar cálculos posteriores
    return Number(subtotal);
  }

  //para calcular impuestos (10% = 0.1), lo retorna como valor numérico, sin formato
  getTax(taxRate = 0.1) {
    return this.getSubtotal() * taxRate;
  }
  //total = subtotal + impuestos agregados
  getTotal(taxRate = 0.1) {
    return this.getSubtotal() + this.getTax(taxRate);
  }

  /*toOrder(customer = { name: '', email: '', address: '' }) {
    return {
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer,
      items: this.getItems(),
      totals: {
        subtotal: this.getSubtotal(),
        tax: this.getTax(),
        total: this.getTotal()
      }
    };
  }*/

  //version asumiendo que cart.js importa la api
  /*convierte el carrito a un objeto de orden, uno que esté listo para persistir o mostrar.
    se incluye detalles por línea: id, qty, price, lineTotal y name (para mostrar la factura)
    se genera un id básico, basado en el resultado de Date.now() */
  toOrder(customer = { name: '', email: '', address: '' }) {
    const apiProducts = api.getProducts();
    const itemsDetailed = this.getItems().map((it) => {
      const prod = apiProducts.find((p) => p.id === it.id) || null;
      const unitPrice = prod ? Number(prod.price) : 0;
      const lineTotal = unitPrice * Number(it.qty);
      return {
        id: it.id,
        qty: Number(it.qty),
        price: Number(unitPrice),
        lineTotal: Number(lineTotal),
        //agrega nombre para que la orden o factura sea legible sin necesidad de cruzarse los datos
        name: prod ? prod.name : it.id
      };
    });

    return {
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer,
      items: itemsDetailed,
      totals: {
        subtotal: this.getSubtotal(),
        tax: this.getTax(),
        total: this.getTotal(),
      },
    };
  }

}
