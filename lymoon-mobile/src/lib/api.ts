// src/lib/api.ts
import { useAuthStore } from '@/stores/authStore';
import { tryRefresh } from './tokenRefresh';
import { API_BASE } from './apiBase';

export { API_BASE };

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof (body as Record<string, unknown>).error === 'string'
        ? (body as Record<string, unknown>).error as string
        : `HTTP ${status}`;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function fetchWithAuth(path: string, options: ApiOptions = {}): Promise<Response> {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const init = {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  };
  const response = await fetch(`${API_BASE}${path}`, init);

  if (response.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
      };
      return fetch(`${API_BASE}${path}`, { ...init, headers: retryHeaders });
    }
  }

  return response;
}

export const apiGet = <T>(path: string) =>
  fetchWithAuth(path, { method: 'GET' }).then(r => handleResponse<T>(r));

export const apiPost = <T>(path: string, body?: unknown) =>
  fetchWithAuth(path, { method: 'POST', body }).then(r => handleResponse<T>(r));

export const apiPatch = <T>(path: string, body?: unknown) =>
  fetchWithAuth(path, { method: 'PATCH', body }).then(r => handleResponse<T>(r));

export const apiDelete = <T>(path: string, body?: unknown) =>
  fetchWithAuth(path, { method: 'DELETE', body }).then(r => handleResponse<T>(r));
