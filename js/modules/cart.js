// js/modules/cart.js
import * as api from './api.js';
import * as inventory from './inventory.js';
import * as validators from './validators.js';

export class Cart {
  constructor() {
    const persisted = api.getCart();
    this.items = Array.isArray(persisted.items) ? persisted.items.slice() : [];
  }

  save() {
    api.saveCart({ items: this.items });
  }

  getItems() {
    return this.items.map(i => ({ ...i }));
  }

  getQty(productId) {
    const it = this.items.find(i => i.id === productId);
    return it ? Number(it.qty) : 0;
  }

  addItem(productId, qty = 1) {
    qty = Number(qty);
    //if (!Number.isInteger(qty) || qty <= 0) return { success: false, reason: 'cantidad_invalida' };
    if (!validators.isPositiveInteger(qty)) return { success: false, reason: 'cantidad_invalida' };

    const available = inventory.getStock(productId);
    if (available === null) return { success: false, reason: 'producto_no_encontrado' };

    const currentInCart = this.getQty(productId);
    if (currentInCart + qty > available) return { success: false, reason: 'stock_insuficiente', available };

    const idx = this.items.findIndex(i => i.id === productId);
    if (idx >= 0) {
      this.items[idx].qty = this.items[idx].qty + qty;
    } else {
      this.items.push({ id: productId, qty });
    }
    this.save();
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: this.getItems() } }));
    return { success: true };
  }

  updateQuantity(productId, newQty) {
    newQty = Number(newQty);
    //if (!Number.isInteger(newQty) || newQty < 0) return { success: false, reason: 'cantidad_invalida' };
    //se debe permitir el "0" para eliminar
    if (!validators.isNonNegativeInteger(newQty)) return { success: false, reason: 'cantidad_invalida' };

    const idx = this.items.findIndex(i => i.id === productId);
    if (idx === -1) return { success: false, reason: 'no_en_carrito' };

    const available = inventory.getStock(productId);
    if (available === null) return { success: false, reason: 'producto_no_encontrado' };
    if (newQty > available) return { success: false, reason: 'stock_insuficiente', available };

    if (newQty === 0) {
      this.items.splice(idx, 1);
    } else {
      this.items[idx].qty = newQty;
    }
    this.save();
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: this.getItems() } }));
    return { success: true };
  }

  removeItem(productId) {
    const idx = this.items.findIndex(i => i.id === productId);
    if (idx >= 0) {
      this.items.splice(idx, 1);
      this.save();
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: this.getItems() } }));
      return true;
    }
    return false;
  }

  clear() {
    this.items = [];
    this.save();
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: { items: this.getItems() } }));
  }

  getSubtotal() {
    const apiProducts = api.getProducts();
    let subtotal = 0;
    for (const it of this.items) {
      const prod = apiProducts.find(p => p.id === it.id);
      if (prod) subtotal += Number(prod.price) * Number(it.qty);
    }
    return Number(subtotal);
  }

  getTax(taxRate = 0.10) {
    return this.getSubtotal() * taxRate;
  }
  getTotal(taxRate = 0.10) {
    return this.getSubtotal() + this.getTax(taxRate);
  }

  toOrder(customer = { name: '', email: '', address: '' }) {
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
  }
}
