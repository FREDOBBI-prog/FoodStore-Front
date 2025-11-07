import { clearCart, getCart, removeItem, updateQty } from '../../../utils/cart';
import type { ICart } from '../../../types/ICart';
import { formatCurrency, onReady } from '../../../utils/navigate';
import { post } from '../../../utils/api';
import { guard, getSession, isAdmin, logout } from '../../../utils/auth';
import type { IOrder } from '../../../types/IOrders';

const ORDER_EVENT = 'fs:order:new';

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
    empty!.style.display = 'flex';
    list!.innerHTML = '';
  } else {
    empty!.style.display = 'none';
    list!.innerHTML = cart.items
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
  subtotal!.textContent = formatCurrency(cart.subtotal);
  total!.textContent = formatCurrency(cart.total);
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
        <label for="customerName">Nombre</label>
        <input id="customerName" type="text" required placeholder="Tu nombre" />
      </div>
      <div class="field">
        <label for="tableOrCounter">Número de mesa o retirar en el mostrador</label>
        <input id="tableOrCounter" type="text" required placeholder="Ej: Mesa 5 o Retirar en mostrador" />
      </div>
      <div class="field">
        <label for="diningType">Tipo de servicio</label>
        <select id="diningType" required>
          <option value="">Seleccionar</option>
          <option value="en_lugar">Comer en el lugar</option>
          <option value="para_llevar">Para llevar</option>
        </select>
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
        <label for="removeCondiments">¿Desea quitar algún condimento?</label>
        <select id="removeCondiments" required>
          <option value="no">No</option>
          <option value="si">Sí</option>
        </select>
      </div>
      <div class="field" id="condimentsDetailsField" style="display:none;">
        <label for="condimentsDetails">¿Cuál condimento?</label>
        <textarea id="condimentsDetails" rows="2" placeholder="Especifica qué condimentos quitar"></textarea>
      </div>
      <div class="row" style="justify-content:flex-end; gap:12px;">
        <button class="btn outline" type="button" id="closeModal">Cancelar</button>
        <button class="btn primary" type="submit">Confirmar</button>
      </div>
    </form>`;
  modal.style.display = 'block';
  modal.classList.add('open');
  backdrop.classList.add('open');
  backdrop.addEventListener('click', close, { once: true });
  const closeBtn = modal.querySelector<HTMLButtonElement>('#closeModal');
  const form = modal.querySelector<HTMLFormElement>(`#${id}`);
  const removeCondimentsSelect = modal.querySelector<HTMLSelectElement>('#removeCondiments');
  const condimentsDetailsField = modal.querySelector<HTMLDivElement>('#condimentsDetailsField');
  
  if (closeBtn) closeBtn.addEventListener('click', close, { once: true });
  if (form) form.addEventListener('submit', submitOrder);
  
  // mostrar/ocultar campo de condimentos
  if (removeCondimentsSelect && condimentsDetailsField) {
    removeCondimentsSelect.addEventListener('change', () => {
      condimentsDetailsField.style.display = removeCondimentsSelect.value === 'si' ? 'block' : 'none';
    });
  }

  function close(): void {
    modal!.style.display = 'none';
    modal!.classList.remove('open');
    backdrop!.classList.remove('open');
  }
}

async function submitOrder(ev: SubmitEvent): Promise<void> {
  ev.preventDefault();
  const customerNameEl = document.querySelector<HTMLInputElement>('#customerName');
  const tableOrCounterEl = document.querySelector<HTMLInputElement>('#tableOrCounter');
  const diningTypeEl = document.querySelector<HTMLSelectElement>('#diningType');
  const paymentEl = document.querySelector<HTMLSelectElement>('#payment');
  const removeCondimentsEl = document.querySelector<HTMLSelectElement>('#removeCondiments');
  const condimentsDetailsEl = document.querySelector<HTMLTextAreaElement>('#condimentsDetails');
  
  const customerName = (customerNameEl?.value || '').trim();
  const tableOrCounter = (tableOrCounterEl?.value || '').trim();
  const diningType = (diningTypeEl?.value || '').trim();
  const payment = (paymentEl?.value || 'efectivo') as 'efectivo' | 'tarjeta' | 'transferencia';
  const removeCondiments = (removeCondimentsEl?.value || 'no').trim();
  const condimentsDetails = (condimentsDetailsEl?.value || '').trim();
  
  if (!customerName || !tableOrCounter || !diningType) {
    alert('Completá todos los campos obligatorios');
    return;
  }
  
  if (removeCondiments === 'si' && !condimentsDetails) {
    alert('Especificá qué condimentos deseas quitar');
    return;
  }
  
  const cart = getCart();
  try {
    const session = getSession();
    
    // armo las notas con toda la informacion adicional
    const notesParts: string[] = [];
    notesParts.push(`Tipo: ${diningType === 'en_lugar' ? 'Comer en el lugar' : 'Para llevar'}`);
    notesParts.push(`Mesa/Mostrador: ${tableOrCounter}`);
    if (removeCondiments === 'si') {
      notesParts.push(`Condimentos a quitar: ${condimentsDetails}`);
    }
    const notes = notesParts.join(' | ');
    
    const orderData = {
      userId: session?.id ?? 0,
      userName: customerName,
      status: 'pending' as const,
      items: cart.items.map((i) => ({
        productId: i.productId,
        qty: i.qty,
        price: i.price,
        name: i.name
      })),
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      total: cart.total,
      deliveryAddress: diningType === 'en_lugar' ? `Mesa/Mostrador: ${tableOrCounter}` : `Para llevar: ${tableOrCounter}`,
      phone: session?.email || 'No especificado',
      paymentMethod: payment,
      notes,
    };
    await post<IOrder, typeof orderData>('/orders', orderData);
    localStorage.setItem('FS_EVT', `order:${Date.now()}`);
    window.dispatchEvent(new CustomEvent(ORDER_EVENT));
    clearCart();
    window.location.href = '../../client/orders/orders.html';
  } catch (e) {
    alert((e as Error).message || 'Error al confirmar pedido');
  }
}

function setupNavbar(): void {
  const user = getSession();
  const cartCount = document.querySelector<HTMLSpanElement>('#cartCount');
  if (cartCount) {
    const totalQty = getCart().items.reduce((acc, item) => acc + item.qty, 0);
    cartCount!.textContent = String(totalQty);
  }

  // menu del usuario
  const dropdown = document.getElementById('userDropdown');
  const btn = document.getElementById('userMenuBtn');
  const nameEl = document.getElementById('menuUserName');
  const emailEl = document.getElementById('menuUserEmail');
  const ordersLink = document.getElementById('ordersLink') as HTMLAnchorElement | null;
  const adminLink = document.getElementById('adminLink') as HTMLAnchorElement | null;
  const accountLink = document.getElementById('accountLink') as HTMLAnchorElement | null;
  const logoutBtn = document.getElementById('logoutMenuBtn');

  if (nameEl && user) nameEl.textContent = user.name || user.email || 'Usuario';
  if (emailEl && user) emailEl.textContent = user.email || '';
  if (ordersLink) ordersLink.style.display = user && user.role === 'cliente' ? 'block' : 'none';
  if (adminLink) adminLink.style.display = isAdmin() ? 'block' : 'none';
  if (accountLink) accountLink.addEventListener('click', (e) => { e.preventDefault(); });

  if (btn && dropdown) {
    const toggle = (): void => {
      const isOpen = !dropdown!.classList.contains('hidden');
      if (isOpen) {
        dropdown!.classList.add('hidden');
        btn!.setAttribute('aria-expanded', 'false');
      } else {
        dropdown!.classList.remove('hidden');
        btn!.setAttribute('aria-expanded', 'true');
      }
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    document.addEventListener('click', (e) => {
      if (!dropdown || dropdown.classList.contains('hidden')) return;
      const target = e.target as HTMLElement;
      if (!target.closest('.user-menu')) {
        dropdown!.classList.add('hidden');
        btn!.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !dropdown!.classList.contains('hidden')) {
        dropdown!.classList.add('hidden');
        btn!.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (logoutBtn) logoutBtn.addEventListener('click', () => logout());
}


