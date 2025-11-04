import { del, get, post, put } from '../../../utils/api';
import type { ICategoria } from '../../../types/ICategoria';
import { onReady } from '../../../utils/navigate';
import { guard, logout } from '../../../utils/auth';

onReady(async () => {
  guard('admin');
  const rows = document.querySelector<HTMLTableSectionElement>('#rows');
  const errorBox = document.querySelector<HTMLDivElement>('#errorBox');
  const loading = document.querySelector<HTMLDivElement>('#loading');
  const empty = document.querySelector<HTMLDivElement>('#emptyState');
  const newBtn = document.querySelector<HTMLButtonElement>('#newBtn');
  if (!rows || !errorBox || !loading || !empty || !newBtn) return;
  document.querySelector<HTMLButtonElement>('#logoutBtn')?.addEventListener('click', () => logout());

  newBtn.addEventListener('click', () => openModal());
  await reload();

  async function reload(): Promise<void> {
    rows!.innerHTML = '';
    errorBox!.classList.add('hidden');
    empty!.classList.add('hidden');
    loading!.classList.remove('hidden');
    try {
      const cats = await get<ICategoria[]>('/categories');
      if (cats.length === 0) { empty!.classList.remove('hidden'); return; }
      rows!.innerHTML = cats.map(renderRow).join('');
      rows!.addEventListener('click', onRowClick);
    } catch (e) {
      errorBox!.textContent = (e as Error).message || 'Error al cargar categorías';
      errorBox!.classList.remove('hidden');
    } finally {
      loading!.classList.add('hidden');
    }
  }

  function renderRow(c: ICategoria): string {
    return `<tr data-id="${c.id}">
      <td>${c.id}</td>
      <td><img src="${c.imageUrl}" alt="${c.name}" /></td>
      <td style="font-weight:600">${c.name}</td>
      <td>${c.description}</td>
      <td><span class="admin-status-badge ${c.active ? 'active' : 'inactive'}">${c.active ? 'Activa' : 'Inactiva'}</span></td>
      <td>
        <div class="admin-table-actions">
          <button class="admin-table-btn edit" data-action="edit">Editar</button>
          <button class="admin-table-btn delete" data-action="delete">Eliminar</button>
        </div>
      </td>
    </tr>`;
  }

  function onRowClick(ev: Event): void {
    const target = ev.target as HTMLElement;
    const tr = target.closest('tr[data-id]') as HTMLTableRowElement | null;
    if (!tr) return;
    const id = Number(tr.dataset.id);
    if ((target as HTMLElement).dataset.action === 'edit') openModal(id);
    if ((target as HTMLElement).dataset.action === 'delete') onDelete(id);
  }

  function openModal(id?: number): void {
    const modal = document.querySelector<HTMLDivElement>('#editModal');
    const backdrop = document.querySelector<HTMLDivElement>('#modalBackdrop');
    if (!modal || !backdrop) return;
    const data: Partial<ICategoria> | undefined = id ? getRowData(id) : undefined;
    modal.innerHTML = `
      <h3 id="modalTitle">${id ? 'Editar' : 'Nueva'} categoría</h3>
      <form id="catForm" class="form">
        <div class="field">
          <label for="name">Nombre</label>
          <input id="name" required value="${data?.name || ''}" />
        </div>
        <div class="field">
          <label for="description">Descripción</label>
          <textarea id="description" required rows="3">${data?.description || ''}</textarea>
        </div>
        <div class="field">
          <label for="imageUrl">Imagen (URL)</label>
          <input id="imageUrl" required value="${data?.imageUrl || ''}" />
        </div>
        <div class="field">
          <label for="active">Activa</label>
          <select id="active"><option value="true" ${data?.active ? 'selected':''}>Sí</option><option value="false" ${data && !data.active ? 'selected':''}>No</option></select>
        </div>
        <div class="row">
          <button class="btn" type="submit">Guardar</button>
          <button class="btn outline right" type="button" id="closeModal">Cancelar</button>
        </div>
      </form>`;
    function close(): void { modal!.style.display = 'none'; backdrop!.classList.remove('open'); }
    modal!.style.display = 'block';
    backdrop!.classList.add('open');
    backdrop!.addEventListener('click', close);
    modal!.querySelector<HTMLButtonElement>('#closeModal')?.addEventListener('click', close);
    // post para crear, put para editar
    modal!.querySelector<HTMLFormElement>('#catForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (document.querySelector<HTMLInputElement>('#name')?.value || '').trim();
      const description = (document.querySelector<HTMLTextAreaElement>('#description')?.value || '').trim();
      const imageUrl = (document.querySelector<HTMLInputElement>('#imageUrl')?.value || '').trim();
      const active = (document.querySelector<HTMLSelectElement>('#active')?.value || 'true') === 'true';
      if (!name || !description || !isValidUrl(imageUrl)) { alert('Completá todos los campos con valores válidos'); return; }
      try {
        if (id) {
          await put<ICategoria, Partial<ICategoria>>(`/categories/${id}`, { name, description, imageUrl, active });
        } else {
          await post<ICategoria, Omit<ICategoria,'id' | 'active'> & { active?: boolean }>('/categories', { name, description, imageUrl, active });
        }
        close();
        await reload();
      } catch (err) {
        alert((err as Error).message || 'Error al guardar');
      }
    });
  }

  function getRowData(id: number): ICategoria | undefined {
    const tr = document.querySelector<HTMLTableRowElement>(`tr[data-id="${id}"]`);
    if (!tr) return undefined;
    const tds = tr.querySelectorAll('td');
    return {
      id,
      imageUrl: (tds[1].querySelector('img') as HTMLImageElement).src,
      name: tds[2].textContent || '',
      description: tds[3].textContent || '',
      active: (tds[4].textContent || '') === 'Sí',
    };
  }

  async function onDelete(id: number): Promise<void> {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
      await del<void>(`/categories/${id}`);
      await reload();
    } catch (e) {
      alert((e as Error).message || 'Error al eliminar');
    }
  }
});

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}


