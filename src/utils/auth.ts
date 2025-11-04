import type { IUser } from '../types/IUser';
import type { ICart } from '../types/ICart';
import { go } from './navigate';

export const FS_USER = 'FS_USER';
export const FS_CART = 'FS_CART';

export function saveSession(user: IUser): void {
  localStorage.setItem(FS_USER, JSON.stringify(user));
}

export function getSession(): IUser | null {
  const raw = localStorage.getItem(FS_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IUser;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

export function isAdmin(): boolean {
  const u = getSession();
  return !!u && u.role === 'admin';
}

export function logout(): void {
  localStorage.removeItem(FS_USER);
  localStorage.removeItem(FS_CART);
  // ruta absoluta porque a veces relativa no funciona bien
  window.location.href = '/src/pages/auth/login/login.html';
}

export function guard(pageRole: 'admin' | 'cliente' | 'any' = 'any'): void {
  const session = getSession();
  if (!session) {
    // no hay sesion, mandalo al login
    window.location.href = '/src/pages/auth/login/login.html';
    return;
  }
  if (pageRole === 'any') return;
  if (pageRole === 'admin' && session.role !== 'admin') {
    // quiso entrar a admin sin ser admin, chau
    window.location.href = '/src/pages/store/home/home.html';
    return;
  }
  // los admins pueden entrar a la tienda tambien
  if (pageRole === 'cliente' && session.role !== 'cliente' && session.role !== 'admin') {
    // solo redirigir si no es cliente ni admin
    window.location.href = '/src/pages/admin/adminHome/adminHome.html';
  }
}


