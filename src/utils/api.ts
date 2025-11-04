import type { IUser } from '../types/IUser';
import type { ICategoria } from '../types/ICategoria';
import type { IProduct } from '../types/IProduct';
import type { IOrder } from '../types/IOrders';

// url base de la api
const BASE_URL: string = (import.meta as unknown as { env: { VITE_API_BASE_URL?: string } }).env.VITE_API_BASE_URL || 'http://localhost:8080';

// modo mock desactivado por ahora
const USE_MOCK: boolean = false;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

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

function makeUrl(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return BASE_URL + path;
}

async function request<T>(path: string, method: HttpMethod, body?: unknown): Promise<T> {
  if (USE_MOCK) {
    // modo mock no implementado aun
    await new Promise((r) => setTimeout(r, 200));
  }

  const url = makeUrl(path);
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  try {
    const resp = await fetch(url, options);
    const contentType = resp.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await resp.json() : await resp.text();

    if (!resp.ok) {
      const msg = (isJson && (data as { message?: string }).message) || `Error HTTP ${resp.status}`;
      throw new ApiError(msg, resp.status, data);
    }
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError((err as Error).message || 'Error de red', 0);
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

// metodo patch para updates parciales
export async function patch<T, B>(path: string, body: B): Promise<T> {
  return request<T>(path, 'PATCH', body as unknown);
}

// tipos para los requests y responses
export type LoginRequest = { email: string; password: string };
export type RegisterRequest = { name: string; email: string; password: string; role?: 'cliente' | 'admin' | 'developer' };

export type CategoriesResponse = ICategoria[];
export type ProductsResponse = IProduct[];
export type ProductResponse = IProduct;
export type OrdersResponse = IOrder[];
export type OrderResponse = IOrder;


