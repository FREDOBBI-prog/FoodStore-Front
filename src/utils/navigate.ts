export function go(path: string): void {
  window.location.href = path;
}

export function onReady(cb: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cb, { once: true });
  } else {
    cb();
  }
}

export function qs<T extends Element>(selector: string, parent?: Document | Element): T | null {
  return (parent || document).querySelector(selector) as T | null;
}

export function qsa<T extends Element>(selector: string, parent?: Document | Element): NodeListOf<T> {
  return (parent || document).querySelectorAll(selector) as NodeListOf<T>;
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(n);
}

export type BadgeKind = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export function renderBadge(text: string, kind: BadgeKind): string {
  return `<span class="badge badge-${kind}">${text}</span>`;
}


