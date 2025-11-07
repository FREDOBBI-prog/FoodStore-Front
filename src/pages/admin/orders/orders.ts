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
      // normalizo los items para asegurar que sean arrays
      orders.forEach(order => {
        if (!Array.isArray(order.items)) {
          order.items = [];
        }
      });
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
  const items = Array.isArray(o.items) ? o.items : [];
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
            <span class="admin-order-value">${items.length} producto${items.length !== 1 ? 's' : ''}</span>
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
  
  // aseguro que items sea un array
  const items = Array.isArray(o.items) ? o.items : [];
  
  // parseo las notas para extraer la informacion
  const notesParts = o.notes ? o.notes.split(' | ') : [];
  let tipoServicio = '';
  let mesaMostrador = '';
  let condimentos = '';
  
  notesParts.forEach(part => {
    if (part.startsWith('Tipo: ')) {
      tipoServicio = part.replace('Tipo: ', '');
    } else if (part.startsWith('Mesa/Mostrador: ')) {
      mesaMostrador = part.replace('Mesa/Mostrador: ', '');
    } else if (part.startsWith('Condimentos a quitar: ')) {
      condimentos = part.replace('Condimentos a quitar: ', '');
    }
  });
  
  // si no se parseo de las notas, uso deliveryAddress
  if (!mesaMostrador && o.deliveryAddress) {
    mesaMostrador = o.deliveryAddress.replace('Mesa/Mostrador: ', '').replace('Para llevar: ', '');
  }
  
  const paymentMethodLabel = o.paymentMethod === 'efectivo' ? 'Efectivo' : 
                            o.paymentMethod === 'tarjeta' ? 'Tarjeta' : 
                            o.paymentMethod === 'transferencia' ? 'Transferencia' : o.paymentMethod;
  
  modal.innerHTML = `
    <h3 id="orderTitle">Pedido #${o.id}</h3>
    <p class="muted">${new Date(o.createdAt).toLocaleString('es-AR')} — ${renderStatusBadge(o.status)}</p>
    <div class="space"></div>
    <div style="background:#f9fafb; padding:16px; border-radius:8px; margin-bottom:16px;">
      <h4 style="margin:0 0 12px 0; font-size:1rem; color:#111827;">Información del Cliente</h4>
      <div class="row"><span>Nombre:</span><strong class="right">${o.userName}</strong></div>
      ${o.phone && o.phone !== 'No especificado' ? `<div class="row"><span>Teléfono:</span><strong class="right">${o.phone}</strong></div>` : ''}
    </div>
    <div style="background:#f0f9ff; padding:16px; border-radius:8px; margin-bottom:16px;">
      <h4 style="margin:0 0 12px 0; font-size:1rem; color:#111827;">Detalles del Pedido</h4>
      ${tipoServicio ? `<div class="row"><span>Tipo de servicio:</span><strong class="right">${tipoServicio}</strong></div>` : ''}
      ${mesaMostrador ? `<div class="row"><span>Mesa/Mostrador:</span><strong class="right">${mesaMostrador}</strong></div>` : ''}
      <div class="row"><span>Método de pago:</span><strong class="right">${paymentMethodLabel}</strong></div>
      ${condimentos ? `<div class="row" style="margin-top:8px;"><span style="color:#dc2626;">Condimentos a quitar:</span><strong class="right" style="color:#dc2626;">${condimentos}</strong></div>` : ''}
    </div>
    <div class="space"></div>
    <h4 style="margin:0 0 12px 0; font-size:1rem; color:#111827;">Productos</h4>
    <div style="background:#f9fafb; padding:12px; border-radius:8px; margin-bottom:16px;">
      ${items.length > 0 ? items.map(i => `
        <div class="row" style="justify-content:space-between; padding:8px 0; border-bottom:1px solid #e5e7eb;">
          <span>${i.name} x${i.qty}</span>
          <strong>${formatCurrency(i.price * i.qty)}</strong>
        </div>`).join('') : '<p class="muted">Sin items</p>'}
    </div>
    <div class="space"></div>
    <div style="background:#fff7ed; padding:16px; border-radius:8px; border:1px solid #fed7aa; margin-bottom:16px;">
      <div class="row"><span>Subtotal:</span><strong class="right">${formatCurrency(o.subtotal)}</strong></div>
      <div class="row"><span>Envío:</span><strong class="right">${formatCurrency(o.shipping)}</strong></div>
      <div class="row" style="margin-top:8px; padding-top:8px; border-top:2px solid #fed7aa; font-size:1.1rem;"><span><strong>Total:</strong></span><strong class="right" style="color:#ea580c;">${formatCurrency(o.total)}</strong></div>
    </div>
    <div class="space"></div>
    <div class="row" style="align-items:center; gap:8px;">
      <label for="statusSel" class="muted">Estado:</label>
      <select id="statusSel" style="flex:1;">
        <option value="pending" ${o.status==='pending'?'selected':''}>Pendiente</option>
        <option value="processing" ${o.status==='processing'?'selected':''}>En preparación</option>
        <option value="completed" ${o.status==='completed'?'selected':''}>Completado</option>
        <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelado</option>
      </select>
      <button class="btn" id="updateStatus">Actualizar Estado</button>
      <button class="btn outline" id="closeModal">Cerrar</button>
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


