import { del, get, post, put } from '../../../utils/api';
import type { IProduct } from '../../../types/IProduct';
import type { ICategoria } from '../../../types/ICategoria';
import { formatCurrency, onReady } from '../../../utils/navigate';
import { logout, guard } from '../../../utils/auth';

onReady(async () => {
  guard('admin');
  const rows = document.querySelector<HTMLTableSectionElement>('#rows');
  const errorBox = document.querySelector<HTMLDivElement>('#errorBox');
  const loading = document.querySelector<HTMLDivElement>('#loading');
  const empty = document.querySelector<HTMLDivElement>('#emptyState');
  const newBtn = document.querySelector<HTMLButtonElement>('#newBtn');
  if (!rows || !errorBox || !loading || !empty || !newBtn) return;
  document.querySelector<HTMLButtonElement>('#logoutBtn')?.addEventListener('click', () => logout());

  newBtn.addEventListener('click', async () => openModal());
  await reload();

  async function reload(): Promise<void> {
    rows.innerHTML = '';
    errorBox.classList.add('hidden');
    empty.classList.add('hidden');
    loading.classList.remove('hidden');
    try {
      const prods = await get<IProduct[]>('/products');
      if (prods.length === 0) { empty.classList.remove('hidden'); return; }
      rows.innerHTML = prods.map(renderRow).join('');
      rows.addEventListener('click', onRowClick);
    } catch (e) {
      errorBox.textContent = (e as Error).message || 'Error al cargar productos';
      errorBox.classList.remove('hidden');
    } finally {
      loading.classList.add('hidden');
    }
  }

  function renderRow(p: IProduct): string {
    return `<tr data-id="${p.id}">
      <td>${p.id}</td>
      <td><img src="${p.imageUrl}" alt="${p.name}" /></td>
      <td style="font-weight:600">${p.name}</td>
      <td>${p.description}</td>
      <td style="font-weight:700; color:#2563eb">${formatCurrency(p.price)}</td>
      <td>${p.categoryName || '—'}</td>
      <td>${p.stock}</td>
      <td><span class="admin-status-badge ${p.available ? 'available' : 'unavailable'}">${p.available ? 'Disponible' : 'Agotado'}</span></td>
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

  async function openModal(id?: number): Promise<void> {
    const modal = document.querySelector<HTMLDivElement>('#editModal');
    const backdrop = document.querySelector<HTMLDivElement>('#modalBackdrop');
    if (!modal || !backdrop) return;
    const data: Partial<IProduct> | undefined = id ? getRowData(id) : undefined;
    const cats = await get<ICategoria[]>('/categories');
    modal.innerHTML = `
      <h3 id="modalTitle">${id ? 'Editar' : 'Nuevo'} producto</h3>
      <form id="prodForm" class="form">
        <div class="field"><label for="name">Nombre</label><input id="name" required value="${data?.name || ''}" /></div>
        <div class="field"><label for="description">Descripción</label><textarea id="description" required rows="3">${data?.description || ''}</textarea></div>
        <div class="field"><label for="price">Precio</label><input id="price" type="number" min="0.01" step="0.01" required value="${data?.price ?? ''}" /></div>
        <div class="field"><label for="stock">Stock</label><input id="stock" type="number" min="0" step="1" required value="${data?.stock ?? ''}" /></div>
        <div class="field"><label for="categoryId">Categoría</label>
          <select id="categoryId" required>
            ${cats.map(c => `<option value="${c.id}" ${data?.categoryId === c.id ? 'selected':''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label for="imageUrl">Imagen (URL)</label><input id="imageUrl" required value="${data?.imageUrl || ''}" /></div>
        <div class="field"><label><input id="available" type="checkbox" ${data?.available ? 'checked':''}/> Disponible</label></div>
        <div class="row"><button class="btn" type="submit">Guardar</button><button class="btn outline right" type="button" id="closeModal">Cancelar</button></div>
      </form>`;
    function close(): void { modal.style.display = 'none'; backdrop.classList.remove('open'); }
    modal.style.display = 'block';
    backdrop.classList.add('open');
    backdrop.addEventListener('click', close);
    modal.querySelector<HTMLButtonElement>('#closeModal')?.addEventListener('click', close);
    // CRUD: POST /products, PUT /products/{id}, DELETE /products/{id}
    modal.querySelector<HTMLFormElement>('#prodForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (document.querySelector<HTMLInputElement>('#name')?.value || '').trim();
      const description = (document.querySelector<HTMLTextAreaElement>('#description')?.value || '').trim();
      const price = Number(document.querySelector<HTMLInputElement>('#price')?.value || '0');
      const stock = Number(document.querySelector<HTMLInputElement>('#stock')?.value || '0');
      const categoryId = Number(document.querySelector<HTMLSelectElement>('#categoryId')?.value || '0');
      const imageUrl = (document.querySelector<HTMLInputElement>('#imageUrl')?.value || '').trim();
      const available = !!document.querySelector<HTMLInputElement>('#available')?.checked;
      if (!name || !description || price <= 0 || stock < 0 || !categoryId || !isValidUrl(imageUrl)) { alert('Completá todos los campos con valores válidos'); return; }
      try {
        if (id) {
          await put<IProduct, Partial<IProduct>>(`/products/${id}`, { name, description, price, stock, categoryId, imageUrl, available });
        } else {
          await post<IProduct, Omit<IProduct,'id' | 'categoryName'>>('/products', { name, description, price, stock, categoryId, imageUrl, available });
        }
        close();
        await reload();
      } catch (err) {
        alert((err as Error).message || 'Error al guardar');
      }
    });
  }

  function getRowData(id: number): IProduct | undefined {
    const tr = document.querySelector<HTMLTableRowElement>(`tr[data-id="${id}"]`);
    if (!tr) return undefined;
    const tds = tr.querySelectorAll('td');
    return {
      id,
      imageUrl: (tds[1].querySelector('img') as HTMLImageElement).src,
      name: tds[2].textContent || '',
      description: tds[3].textContent || '',
      price: parseFromCurrency(tds[4].textContent || '0'),
      categoryId: 0,
      stock: Number(tds[6].textContent || '0'),
      available: (tds[7].textContent || '') === 'Sí',
    } as IProduct;
  }

  async function onDelete(id: number): Promise<void> {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await del<void>(`/products/${id}`);
      await reload();
    } catch (e) {
      alert((e as Error).message || 'Error al eliminar');
    }
  }
});

function isValidUrl(url: string): boolean { try { new URL(url); return true; } catch { return false; } }
function parseFromCurrency(text: string): number { return Number((text.replace(/[^0-9,.-]/g,'').replace('.', '').replace(',', '.')) || '0'); }


