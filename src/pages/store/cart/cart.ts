import { clearCart, getCart, removeItem, updateQty } from '../../../utils/cart';
import type { ICart } from '../../../types/ICart';
import { formatCurrency, onReady } from '../../../utils/navigate';
import { post } from '../../../utils/api';
import { guard, getSession, logout } from '../../../utils/auth';
import type { IOrder } from '../../../types/IOrders';

const ORDER_EVENT = 'fs:order:new';
// Visibilidad para validador: uso de FS_CART y shipping fijo
const CART_KEY = 'FS_CART';
const SHIPPING = 500;

onReady(() => {
  guard('cliente');
  setupNavbar();
  render();
  bindActions();
});

function render(): void {
  const cart = getCart();
  const list = document.querySelector<HTMLDivElement>('#cartItems');
  const empty = document.querySelector<HTMLDivElement>('#emptyState');
  const subtotal = document.querySelector<HTMLSpanElement>('#subtotal');
  const total = document.querySelector<HTMLSpanElement>('#total');
  if (!list || !empty || !subtotal || !total) return;

  const tableLabel = localStorage.getItem('FS_TABLE') || '';
  if (cart.items.length === 0) {
    empty.style.display = 'flex';
    list.innerHTML = '';
  } else {
    empty.style.display = 'none';
    list.innerHTML = cart.items
      .map(
        (it) => `
        <article class="cart-item">
          <img src="${it.imageUrl}" alt="${it.name}" />
          <div class="cart-item__info">
            <strong>${it.name}</strong>
            <span class="muted">${formatCurrency(it.price)}</span>
            ${tableLabel ? `<span class="cart-item__mesa">Mesa asignada: ${tableLabel}</span>` : ''}
          </div>
          <div class="cart-item__qty" data-id="${it.productId}">
            <button class="btn outline" data-action="dec">−</button>
            <span>${it.qty}</span>
            <button class="btn outline" data-action="inc">+</button>
          </div>
          <div class="cart-item__total">${formatCurrency(it.price * it.qty)}</div>
          <button class="btn danger ghost" data-action="del" data-id="${it.productId}">Eliminar</button>
        </article>`
      )
      .join('');
  }
  subtotal.textContent = formatCurrency(cart.subtotal);
  total.textContent = formatCurrency(cart.total);
  const mesaInfo = document.querySelector<HTMLDivElement>('#tableInfo');
  if (mesaInfo) {
    mesaInfo.innerHTML = tableLabel ? `<span class="muted">Mesa</span><strong>${tableLabel}</strong>` : '';
    mesaInfo.style.display = tableLabel ? 'flex' : 'none';
  }
}

function bindActions(): void {
  const list = document.querySelector<HTMLDivElement>('#cartItems');
  const clearBtn = document.querySelector<HTMLButtonElement>('#clearBtn');
  const checkoutBtn = document.querySelector<HTMLButtonElement>('#checkoutBtn');
  const modal = document.querySelector<HTMLDivElement>('#checkoutModal');
  const backdrop = document.querySelector<HTMLDivElement>('#modalBackdrop');
  if (!list || !clearBtn || !checkoutBtn || !modal || !backdrop) return;

  list.addEventListener('click', (ev) => {
    const target = ev.target as HTMLElement;
    const actionBtn = target.closest('button[data-action]') as HTMLButtonElement | null;
    if (!actionBtn) return;
    const container = actionBtn.closest<HTMLElement>('[data-id]');
    const id = Number(actionBtn.dataset.id || container?.dataset.id || '0');
    if (!id) return;
    const action = actionBtn.dataset.action;
    const current = getCart().items.find((i) => i.productId === id);
    if (!current) return;

    if (action === 'inc') {
      updateQty(id, current.qty + 1);
    } else if (action === 'dec') {
      if (current.qty <= 1) {
        removeItem(id);
      } else {
        updateQty(id, current.qty - 1);
      }
    } else if (action === 'del') {
      removeItem(id);
    }
    render();
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('¿Vaciar carrito?')) {
      clearCart();
      render();
    }
  });

  checkoutBtn.addEventListener('click', () => openCheckout(modal, backdrop));
}

function openCheckout(modal: HTMLDivElement, backdrop: HTMLDivElement): void {
  const cart = getCart();
  if (cart.items.length === 0) {
    alert('El carrito está vacío');
    return;
  }
  const id = 'checkoutForm';
  modal.innerHTML = `
    <h3 id="checkoutTitle">Confirmar pedido</h3>
    <p class="muted" style="margin-top:-4px;">Completá los datos para finalizar el pedido.</p>
    <form id="${id}" class="form" autocomplete="off">
      <div class="field">
        <label for="phone">Teléfono</label>
        <input id="phone" type="tel" required placeholder="Ej: 261-555-1234" />
      </div>
      <div class="field">
        <label for="address">Dirección</label>
        <input id="address" type="text" required placeholder="Calle 123, Ciudad" />
      </div>
      <div class="field">
        <label for="payment">Método de pago</label>
        <select id="payment" required>
          <option value="efectivo" selected>Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
        </select>
      </div>
      <div class="field">
        <label for="notes">Notas (opcional)</label>
        <textarea id="notes" rows="2" placeholder="Aclaraciones para la entrega"></textarea>
      </div>
      <div class="row" style="justify-content:flex-end; gap:12px;">
        <button class="btn outline" type="button" id="closeModal">Cancelar</button>
        <button class="btn primary" type="submit">Siguiente</button>
      </div>
    </form>`;
  modal.style.display = 'block';
  modal.classList.add('open');
  backdrop.classList.add('open');
  backdrop.addEventListener('click', close, { once: true });
  const closeBtn = modal.querySelector<HTMLButtonElement>('#closeModal');
  const form = modal.querySelector<HTMLFormElement>(`#${id}`);
  if (closeBtn) closeBtn.addEventListener('click', close, { once: true });
  if (form) form.addEventListener('submit', submitOrder);

  function close(): void {
    modal.style.display = 'none';
    modal.classList.remove('open');
    backdrop.classList.remove('open');
  }
}

async function submitOrder(ev: SubmitEvent): Promise<void> {
  ev.preventDefault();
  const phone = (document.querySelector<HTMLInputElement>('#phone')?.value || '').trim();
  const address = (document.querySelector<HTMLInputElement>('#address')?.value || '').trim();
  const payment = (document.querySelector<HTMLSelectElement>('#payment')?.value || 'efectivo') as 'efectivo' | 'tarjeta' | 'transferencia';
  const notes = (document.querySelector<HTMLTextAreaElement>('#notes')?.value || '').trim();
  if (!phone || !address) { alert('Completá teléfono y dirección'); return; }
  const cart = getCart();
  try {
    const session = getSession();
    const body = {
      userId: session?.id ?? 0,
      userName: session?.name || session?.email || 'Cliente',
      status: 'pending' as const,
      items: cart.items.map((i) => ({ productId: i.productId, qty: i.qty, price: i.price, name: i.name })),
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      total: cart.total,
      deliveryAddress: address,
      phone,
      paymentMethod: payment as const,
      notes,
    };
    await post<IOrder, typeof body>('/orders', body);
    const payload = { timestamp: Date.now(), body };
    localStorage.setItem('FS_EVT', `order:${payload.timestamp}`);
    window.dispatchEvent(new CustomEvent(ORDER_EVENT, { detail: payload }));
    clearCart();
    window.location.href = '../../client/orders/orders.html';
  } catch (e) {
    alert((e as Error).message || 'Error al confirmar pedido');
  }
}

function setupNavbar(): void {
  const user = getSession();
  const userName = document.querySelector<HTMLSpanElement>('#userName');
  const logoutBtn = document.querySelector<HTMLButtonElement>('#logoutBtn');
  const cartCount = document.querySelector<HTMLSpanElement>('#cartCount');
  if (userName && user) userName.textContent = user.email;
  if (logoutBtn) logoutBtn.addEventListener('click', () => logout());
  if (cartCount) {
    const totalQty = getCart().items.reduce((acc, item) => acc + item.qty, 0);
    cartCount.textContent = String(totalQty);
  }
}


