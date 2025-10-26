import { get } from '../../../utils/api';
import type { IProduct } from '../../../types/IProduct';
import { addItem, getCart } from '../../../utils/cart';
import { formatCurrency, onReady } from '../../../utils/navigate';
import { guard, getSession, logout } from '../../../utils/auth';

onReady(async () => {
  guard('cliente');
  setupNavbar();
  const params = new URLSearchParams(window.location.search);
  const idStr = params.get('id');
  const id = idStr ? Number(idStr) : NaN;
  const errorBox = document.querySelector<HTMLDivElement>('#errorBox');
  const loading = document.querySelector<HTMLDivElement>('#loading');
  const view = document.querySelector<HTMLDivElement>('#productView');
  if (!errorBox || !loading || !view || !Number.isFinite(id)) return;

  errorBox.style.display = 'none';
  loading.style.display = 'block';
  try {
    const product = await get<IProduct>(`/products/${id}`);
    render(product);
  } catch (err) {
    errorBox.textContent = (err as Error).message || 'Error al cargar producto';
    errorBox.style.display = 'block';
  } finally {
    loading.style.display = 'none';
  }

  function render(p: IProduct): void {
    const disabled = !p.available || p.stock <= 0;
    view.innerHTML = `
      <div>
        <img src="${p.imageUrl}" alt="${p.name}" style="width:100%; height:auto; border-radius:10px;" />
      </div>
      <div>
        <h2>${p.name}</h2>
        <p class="muted">${p.description}</p>
        <p><strong>${formatCurrency(p.price)}</strong></p>
        <p>Stock: ${p.stock}</p>
        <div class="row">
          <label for="qty">Cantidad</label>
          <input id="qty" type="number" min="1" max="${p.stock}" value="1" style="width:100px" ${disabled ? 'disabled' : ''} />
        </div>
        <div class="space"></div>
        <button id="addBtn" class="btn" ${disabled ? 'disabled' : ''}>Agregar al carrito</button>
      </div>`;
    const addBtn = document.querySelector<HTMLButtonElement>('#addBtn');
    const qtyInput = document.querySelector<HTMLInputElement>('#qty');
    if (addBtn && qtyInput) {
      addBtn.addEventListener('click', () => {
        const qty = Number(qtyInput.value || '1');
        try {
          addItem(p, qty);
          alert('Producto agregado al carrito');
          window.location.href = '../cart/cart.html';
        } catch (e) {
          alert((e as Error).message);
        }
      });
    }
  }
});

function setupNavbar(): void {
  const user = getSession();
  const userName = document.querySelector<HTMLSpanElement>('#userName');
  const logoutBtn = document.querySelector<HTMLButtonElement>('#logoutBtn');
  const cartCount = document.querySelector<HTMLSpanElement>('#cartCount');
  if (userName && user) userName.textContent = user.name;
  if (logoutBtn) logoutBtn.addEventListener('click', () => logout());
  if (cartCount) cartCount.textContent = String(getCart().items.reduce((a, b) => a + b.qty, 0));
}


