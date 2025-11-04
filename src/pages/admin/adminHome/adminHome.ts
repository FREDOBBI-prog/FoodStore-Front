import { get } from "../../../utils/api";
import { logout } from "../../../utils/auth";
import type { ICategoria } from "../../../types/ICategoria";
import type { IProduct } from "../../../types/IProduct";
import type { IOrder, OrderStatus } from "../../../types/IOrders";

const $ = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const show = (id: string) => $(id)?.classList.remove("hidden");
const hide = (id: string) => $(id)?.classList.add("hidden");

$("#logoutBtn")?.addEventListener("click", logout);
$("#refreshBtn")?.addEventListener("click", loadSummary);

type DonutSlice = { value: number; color: string; label: string };

function renderDonut(el: SVGElement, slices: DonutSlice[]) {
  // limpio los slices anteriores
  [...el.querySelectorAll("path[data-slice]")].forEach(n => n.remove());
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  slices.forEach((s) => {
    const val = (s.value / total) * 100;
    const dash = `${val} ${100 - val}`;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("data-slice","1");
    path.setAttribute("fill","none");
    path.setAttribute("stroke", s.color);
    path.setAttribute("stroke-width","6");
    path.setAttribute("d","M21 21 m 0 -15.915 a 15.915 15.915 0 1 1 0 31.83 a 15.915 15.915 0 1 1 0 -31.83");
    path.setAttribute("stroke-dasharray", dash);
    path.setAttribute("stroke-dashoffset", String(100 - acc));
    el.appendChild(path);
    acc += val;
  });
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR').format(n);
}

async function loadSummary() {
  hide("#adminError"); hide("#adminEmpty"); show("#adminLoading");

  try {
    const [cats, prods, orders] = await Promise.all([
      get<ICategoria[]>("/categories"),
      get<IProduct[]>("/products"),
      get<IOrder[]>("/orders"),
    ]);

    // contadores de categorias
    const catAct = cats.filter(c => c.active).length;
    const catInact = cats.length - catAct;
    $("#catTotal")!.textContent = fmt(cats.length);
    $("#catActivas")!.textContent = fmt(catAct);
    $("#catInactivas")!.textContent = fmt(catInact);

    // contadores de productos
    const pDisp = prods.filter(p => p.available).length;
    const pNo = prods.length - pDisp;
    $("#prodTotal")!.textContent = fmt(prods.length);
    $("#prodDisponibles")!.textContent = fmt(pDisp);
    $("#prodNoDisponibles")!.textContent = fmt(pNo);

    // cuento pedidos por estado y armo el donut
    const estados: Record<OrderStatus, number> = { pending:0, processing:0, completed:0, cancelled:0 };
    orders.forEach(o => estados[o.status]++);
    $("#pendingCount")!.textContent = fmt(estados.pending);
    $("#processingCount")!.textContent = fmt(estados.processing);
    $("#completedCount")!.textContent = fmt(estados.completed);
    $("#cancelledCount")!.textContent = fmt(estados.cancelled);

    const donut = document.getElementById("ordersDonut") as SVGElement | null;
    if (donut) {
      renderDonut(donut, [
        { value: estados.pending,   color: "#f59e0b", label: "Pendientes" },
        { value: estados.processing,color: "#3b82f6", label: "Procesando" },
        { value: estados.completed, color: "#10b981", label: "Completados" },
        { value: estados.cancelled, color: "#ef4444", label: "Cancelados" },
      ]);
    }

    // top 5 productos con mas stock
    const top = [...prods].sort((a,b) => (b.stock ?? 0) - (a.stock ?? 0)).slice(0,5);
    const topEl = $("#topProducts")!;
    topEl.innerHTML = top.length ? top.map(p => `
      <div class="item-pro">
        <div style="display:flex; align-items:center; gap:10px">
          <img src="${p.imageUrl}" alt="${p.name}" style="width:42px; height:42px; border-radius:8px; object-fit:cover">
          <div>
            <div style="font-weight:600; font-size:0.875rem; color:#111827">${p.name}</div>
            <div style="font-size:0.75rem; color:#6b7280">${p.categoryName ?? "Sin categoría"}</div>
          </div>
        </div>
        <div style="font-weight:700; font-size:0.875rem; color:#111827">$${fmt(p.price)}</div>
      </div>
    `).join("") : '<div style="color:#9ca3af; text-align:center; padding:20px">No hay productos</div>';

    // ultimos 5 pedidos ordenados por fecha
    const recent = [...orders].sort((a,b) => (b.createdAt.localeCompare(a.createdAt))).slice(0,5);
    const recentEl = $("#recentActions")!;
    const statusMap = {
      pending: { label: 'Pendiente', color: '#f59e0b' },
      processing: { label: 'Procesando', color: '#3b82f6' },
      completed: { label: 'Completado', color: '#10b981' },
      cancelled: { label: 'Cancelado', color: '#dc2626' }
    };
    recentEl.innerHTML = recent.length ? recent.map(o => {
      const st = statusMap[o.status];
      return `
      <div class="item-pro">
        <div style="display:flex; align-items:center; gap:10px">
          <div style="width:8px; height:8px; border-radius:50%; background:${st.color}"></div>
          <div>
            <div style="font-weight:600; font-size:0.875rem; color:#111827">Pedido #${o.id}</div>
            <div style="font-size:0.75rem; color:#6b7280">${new Date(o.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700; font-size:0.875rem; color:#111827">$${fmt(o.total)}</div>
          <div style="font-size:0.75rem; color:${st.color}">${st.label}</div>
        </div>
      </div>
    `}).join("") : '<div style="color:#9ca3af; text-align:center; padding:20px">No hay actividad reciente</div>';

    // muestro la hora de actualizacion
    $("#updatedAt")!.textContent = "Actualizado: " + new Date().toLocaleTimeString('es-AR');

    // oculto el loading
    hide("#adminLoading");
    if (!cats.length && !prods.length && !orders.length) show("#adminEmpty");

  } catch (err) {
    console.error(err);
    hide("#adminLoading"); show("#adminError");
  }
}

loadSummary();



