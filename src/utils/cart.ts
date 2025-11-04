import type { ICart, ICartItem } from '../types/ICart';
import type { IProduct } from '../types/IProduct';
import { FS_CART } from './auth';

const SHIPPING_COST = 500;

function save(cart: ICart): void {
  localStorage.setItem(FS_CART, JSON.stringify(cart));
}

function getTimestamp(): string {
  return new Date().toISOString();
}

export function getCart(): ICart {
  const raw = localStorage.getItem(FS_CART);
  if (raw) {
    try {
      return JSON.parse(raw) as ICart;
    } catch {
      // fallback
    }
  }
  const empty: ICart = {
    items: [],
    subtotal: 0,
    shipping: 0,
    total: 0,
    updatedAt: getTimestamp(),
  };
  save(empty);
  return empty;
}

export function recalcTotals(): ICart {
  const cart = getCart();
  cart.subtotal = cart.items.reduce((acc, it) => acc + it.price * it.qty, 0);
  cart.shipping = cart.items.length > 0 ? SHIPPING_COST : 0;
  cart.total = cart.subtotal + cart.shipping;
  cart.updatedAt = getTimestamp();
  save(cart);
  return cart;
}

export function addItem(product: IProduct, qty: number): ICart {
  if (!product.available || product.stock <= 0) {
    throw new Error('Producto no disponible');
  }
  if (qty < 1) qty = 1;
  if (qty > product.stock) {
    throw new Error('Cantidad supera el stock disponible');
  }
  const cart = getCart();
  const existing = cart.items.find((it) => it.productId === product.id);
  if (existing) {
    const newQty = Math.min(existing.qty + qty, existing.max);
    existing.qty = newQty;
  } else {
    const item: ICartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      qty,
      max: product.stock,
    };
    cart.items.push(item);
  }
  save(cart);
  return recalcTotals();
}

export function updateQty(productId: number, newQty: number): ICart {
  const cart = getCart();
  const item = cart.items.find((it) => it.productId === productId);
  if (!item) return cart;
  if (newQty <= 0) {
    cart.items = cart.items.filter((it) => it.productId !== productId);
  } else {
    item.qty = Math.min(newQty, item.max);
  }
  save(cart);
  return recalcTotals();
}

export function removeItem(productId: number): ICart {
  const cart = getCart();
  cart.items = cart.items.filter((it) => it.productId !== productId);
  save(cart);
  return recalcTotals();
}

export function clearCart(): ICart {
  const empty = {
    items: [],
    subtotal: 0,
    shipping: 0,
    total: 0,
    updatedAt: getTimestamp(),
  } satisfies ICart;
  save(empty);
  return empty;
}


