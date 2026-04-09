// src/lib/api.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { tryRefresh } from './tokenRefresh';

function resolveApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_BASE) {
    return process.env.EXPO_PUBLIC_API_BASE;
  }
  if (__DEV__) {
    // Physical device (iOS/Android): derive host from Expo Go's Metro bundler address.
    // debuggerHost is the LAN IP Expo is serving from (e.g. "192.168.1.5:8081").
    // The API must also bind to 0.0.0.0 (not just localhost) to be reachable via LAN.
    const debuggerHost = Constants.expoGoConfig?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      return `http://${host}:5253/api`;
    }
    // Emulator fallbacks when debuggerHost is unavailable
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:5253/api'
      : 'http://localhost:5253/api';
  }
  return 'http://localhost:5253/api';
}

export const API_BASE = resolveApiBase();

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
