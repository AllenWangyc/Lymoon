// src/lib/api.ts
import { useAuthStore } from '@/stores/authStore';
import { tryRefresh } from './tokenRefresh';

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:5000/api';

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: 'Unknown error' }))) as { error: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
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
      headers['Authorization'] = `Bearer ${useAuthStore.getState().accessToken}`;
      return fetch(`${API_BASE}${path}`, init);
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
