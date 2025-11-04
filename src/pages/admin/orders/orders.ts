import { get, patch } from '../../../utils/api';
import type { IOrder, OrderStatus } from '../../../types/IOrders';
import { formatCurrency, onReady, renderBadge } from '../../../utils/navigate';
import { guard, logout } from '../../../utils/auth';

const ORDER_EVENT = 'fs:order:new';

onReady(async () => {
  guard('admin');
  const grid = document.querySelector<HTMLDivElement>('#ordersGrid');
  const errorBox = document.querySelector<HTMLDivElement>('#errorBox');
  const loading = document.querySelector<HTMLDivElement>('#loading');
  const empty = document.querySelector<HTMLDivElement>('#emptyState');
  const filter = document.querySelector<HTMLSelectElement>('#statusFilter');
  if (!grid || !errorBox || !loading || !empty || !filter) return;

  document.getElementById('logoutBtn')?.addEventListener('click', () => logout());
  filter.addEventListener('change', reload);
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'FS_EVT') void reload();
  });
  window.addEventListener(ORDER_EVENT, () => void reload());
  await reload();

  async function reload(): Promise<void> {
    grid!.innerHTML = '';
    errorBox!.classList.add('hidden');
    empty!.classList.add('hidden');
    loading!.classList.remove('hidden');
    try {
      const orders = await get<IOrder[]>(filter!.value ? `/orders/status/${filter!.value}` : '/orders');
      if (orders.length === 0) {
        empty!.classList.remove('hidden');
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
    } catch (e) {
      errorBox!.textContent = (e as Error).message || 'Error al cargar pedidos';
      errorBox!.classList.remove('hidden');
    } finally {
      loading!.classList.add('hidden');
    }
  }
});

function renderCard(o: IOrder): string {
  const statusLabels = {
    pending: 'Pendiente',
    processing: 'En preparación',
    completed: 'Completado',
    cancelled: 'Cancelado'
  };
  return `
    <article class="admin-order-card" data-order-id="${o.id}">
      <div class="admin-order-header">
        <div class="admin-order-id">Pedido #${o.id}</div>
        <span class="admin-order-status ${o.status}">${statusLabels[o.status]}</span>
      </div>
      <div class="admin-order-body">
        <div class="admin-order-info">
          <div class="admin-order-row">
            <span class="admin-order-label">Cliente:</span>
            <span class="admin-order-value">${o.userName}</span>
          </div>
          <div class="admin-order-row">
            <span class="admin-order-label">Fecha:</span>
            <span class="admin-order-value">${new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <div class="admin-order-row">
            <span class="admin-order-label">Items:</span>
            <span class="admin-order-value">${o.items.length} producto${o.items.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="admin-order-row">
            <span class="admin-order-label">Total:</span>
            <span class="admin-order-total">${formatCurrency(o.total)}</span>
          </div>
        </div>
      </div>
    </article>`;
}

function renderStatusBadge(status: IOrder['status']): string {
  const map: Record<IOrder['status'], { text: string; kind: Parameters<typeof renderBadge>[1] }> = {
    pending: { text: 'Pendiente', kind: 'warning' },
    processing: { text: 'En preparación', kind: 'info' },
    completed: { text: 'Completado', kind: 'success' },
    cancelled: { text: 'Cancelado', kind: 'danger' },
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
    <div>${o.items.map(i => `
      <div class="row" style="justify-content:space-between;">
        <span>${i.name} x${i.qty}</span>
        <span>${formatCurrency(i.price * i.qty)}</span>
      </div>`).join('')}</div>
    <div class="space"></div>
    <div class="row"><span>Subtotal</span><strong class="right">${formatCurrency(o.subtotal)}</strong></div>
    <div class="row"><span>Envío</span><strong class="right">${formatCurrency(o.shipping)}</strong></div>
    <div class="row"><span>Total</span><strong class="right">${formatCurrency(o.total)}</strong></div>
    <div class="space"></div>
    <div class="row" style="align-items:center; gap:8px;">
      <label for="statusSel" class="muted">Estado</label>
      <select id="statusSel">
        ${['pending','processing','completed','cancelled'].map(s => `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
      </select>
      <button class="btn" id="updateStatus">Actualizar Estado</button>
      <button class="btn outline right" id="closeModal">Cerrar</button>
    </div>`;
  modal!.style.display = 'block';
  backdrop!.classList.add('open');
  backdrop!.addEventListener('click', close);
  modal!.querySelector<HTMLButtonElement>('#closeModal')?.addEventListener('click', close);
  modal!.querySelector<HTMLButtonElement>('#updateStatus')?.addEventListener('click', async () => {
    const status = (modal!.querySelector<HTMLSelectElement>('#statusSel')?.value || 'pending') as OrderStatus;
    try {
      await patch<IOrder, { status: OrderStatus }>(`/orders/${o.id}/status`, { status });
      alert('Estado actualizado');
      close();
      window.location.reload();
    } catch (e) {
      alert((e as Error).message || 'Error al actualizar');
    }
  });

  function close(): void {
    modal!.style.display = 'none';
    backdrop!.classList.remove('open');
  }
}


