import type { IUser } from '../types/IUser';
import type { ICategoria } from '../types/ICategoria';
import type { IProduct } from '../types/IProduct';
import type { IOrder } from '../types/IOrders';

// API base URL
const BASE_URL: string = (import.meta as unknown as { env: { VITE_API_BASE_URL?: string } }).env.VITE_API_BASE_URL || 'http://localhost:8080';

// Modo demo opcional
const USE_MOCK: boolean = false;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

class ApiError extends Error {
  public readonly status: number;
  public readonly details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function buildUrl(path: string): string {
  const sanitized = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${sanitized}`;
}

async function request<T>(path: string, method: HttpMethod, body?: unknown): Promise<T> {
  if (USE_MOCK) {
    // Placeholder para modo mock (no requerido por consigna)
    await new Promise((r) => setTimeout(r, 200));
  }

  const url = buildUrl(path);
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  try {
    const resp = await fetch(url, init);
    const contentType = resp.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await resp.json() : await resp.text();

    if (!resp.ok) {
      const message = (isJson && (payload as { message?: string }).message) || `Error HTTP ${resp.status}`;
      throw new ApiError(message, resp.status, payload);
    }
    return payload as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    const unknownError = err as Error;
    throw new ApiError(unknownError.message || 'Error de red', 0);
  }
}

export async function get<T>(path: string): Promise<T> {
  return request<T>(path, 'GET');
}

export async function post<T, B>(path: string, body: B): Promise<T> {
  return request<T>(path, 'POST', body);
}

export async function put<T, B>(path: string, body: B): Promise<T> {
  return request<T>(path, 'PUT', body);
}

export async function del<T>(path: string): Promise<T> {
  return request<T>(path, 'DELETE');
}

// Método PATCH para endpoints que actualizan parcialmente recursos
export async function patch<T, B>(path: string, body: B): Promise<T> {
  return request<T>(path, 'PATCH', body as unknown);
}

// Endpoints esperados (solo tipos de ayuda, no funciones concretas)
export type LoginRequest = { email: string; password: string };
export type RegisterRequest = { name: string; email: string; password: string; role?: 'cliente' | 'admin' | 'developer' };

export type CategoriesResponse = ICategoria[];
export type ProductsResponse = IProduct[];
export type ProductResponse = IProduct;
export type OrdersResponse = IOrder[];
export type OrderResponse = IOrder;


