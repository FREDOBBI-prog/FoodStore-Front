import { get } from '../../../utils/api';
import type { IOrder } from '../../../types/IOrders';
import { formatCurrency, onReady, renderBadge } from '../../../utils/navigate';
import { guard, getSession, logout } from '../../../utils/auth';
import { getCart } from '../../../utils/cart';

onReady(async () => {
  guard('cliente');
  const grid = document.querySelector<HTMLDivElement>('#ordersGrid');
  const errorBox = document.querySelector<HTMLDivElement>('#errorBox');
  const loading = document.querySelector<HTMLDivElement>('#loading');
  const empty = document.querySelector<HTMLDivElement>('#emptyState');
  if (!grid || !errorBox || !loading || !empty) return;
  setupNavbar();
  grid!.innerHTML = '';
  errorBox!.style.display = 'none';
  loading!.style.display = 'block';
  try {
    const session = getSession();
    const userId = session?.id;
    const orders = await get<IOrder[]>(userId ? `/orders/user/${userId}` : '/orders');
    if (orders.length === 0) {
      empty!.style.display = 'block';
      return;
    }
    orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    grid!.innerHTML = orders.map(renderCard).join('');
    grid!.addEventListener('click', (ev) => {
      const card = (ev.target as HTMLElement).closest('[data-order-id]') as HTMLElement | null;
      if (!card) return;
      const id = Number(card.dataset.orderId);
      const order = orders.find((o) => o.id === id);
      if (order) openModal(order);
    });
  } catch (err) {
    errorBox!.textContent = (err as Error).message || 'Error al cargar pedidos';
    errorBox!.style.display = 'block';
  } finally {
    loading!.style.display = 'none';
  }
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'FS_EVT') {
      location.reload();
    }
  });
});

function renderCard(o: IOrder): string {
  const itemsSummary = summarizeItems(o);
  return `
    <article class="card" data-order-id="${o.id}" style="cursor:pointer;">
      <div class="card-body">
        <div class="row" style="justify-content:space-between; align-items:center;">
          <strong>#${o.id}</strong>
          ${renderStatusBadge(o.status)}
        </div>
        <div class="muted">${new Date(o.createdAt).toLocaleString('es-AR')}</div>
        <div>${itemsSummary}</div>
        <div class="row" style="justify-content:space-between; align-items:center;">
          <span class="muted">${o.items.length} ítems</span>
          <strong>${formatCurrency(o.total)}</strong>
        </div>
      </div>
    </article>`;
}

function summarizeItems(o: IOrder): string {
  const names = o.items.slice(0, 3).map((i) => `${i.name} x${i.qty}`);
  const extra = o.items.length > 3 ? ` +${o.items.length - 3} más` : '';
  return names.join(', ') + extra;
}

function renderStatusBadge(status: IOrder['status']): string {
  const map: Record<IOrder['status'], { text: string; kind: Parameters<typeof renderBadge>[1] }> = {
    pending: { text: 'Pendiente ⏳', kind: 'warning' },
    processing: { text: 'En preparación 👨‍🍳', kind: 'info' },
    completed: { text: 'Entregado ✅', kind: 'success' },
    cancelled: { text: 'Cancelado ❌', kind: 'danger' },
  };
  const cfg = map[status];
  return renderBadge(cfg.text, cfg.kind);
}

function openModal(o: IOrder): void {
  const modal = document.querySelector<HTMLDivElement>('#orderModal');
  const backdrop = document.querySelector<HTMLDivElement>('#modalBackdrop');
  if (!modal || !backdrop) return;
  modal.innerHTML = `
    <h3 id="orderTitle">Pedido #${o.id}</h3>
    <p class="muted">${new Date(o.createdAt).toLocaleString('es-AR')} — ${renderStatusBadge(o.status)}</p>
    <div class="space"></div>
    <div class="row"><span>Cliente</span><strong class="right">${o.userName}</strong></div>
    <div class="row"><span>Teléfono</span><strong class="right">${o.phone}</strong></div>
    <div class="row"><span>Entrega</span><strong class="right">${o.deliveryAddress}</strong></div>
    <div class="space"></div>
    <div>${o.items.map((i) => `
      <div class="row" style="justify-content:space-between;">
        <span>${i.name} x${i.qty}</span>
        <span>${formatCurrency(i.price * i.qty)}</span>
      </div>`).join('')}</div>
    <div class="space"></div>
    <div class="row"><span>Subtotal</span><strong class="right">${formatCurrency(o.subtotal)}</strong></div>
    <div class="row"><span>Envío</span><strong class="right">${formatCurrency(o.shipping)}</strong></div>
    <div class="row"><span>Total</span><strong class="right">${formatCurrency(o.total)}</strong></div>
    ${o.notes ? `<div class="banner">Notas: ${o.notes}</div>` : ''}
    <div class="space"></div>
    <div class="row">
      <button class="btn outline right" id="closeModal">Cerrar</button>
    </div>`;
  modal!.style.display = 'block';
  backdrop!.classList.add('open');
  backdrop!.addEventListener('click', close);
  modal!.querySelector<HTMLButtonElement>('#closeModal')?.addEventListener('click', close);
  function close(): void {
    modal!.style.display = 'none';
    backdrop!.classList.remove('open');
  }
}

function setupNavbar(): void {
  const session = getSession();
  const userName = document.querySelector<HTMLSpanElement>('#userName');
  if (userName && session) userName.textContent = session.name;
  document.getElementById('logoutBtn')?.addEventListener('click', () => logout());
  const cartCount = document.querySelector<HTMLSpanElement>('#cartCount');
  if (cartCount) cartCount.textContent = String(getCart().items.reduce((a, b) => a + b.qty, 0));
}


