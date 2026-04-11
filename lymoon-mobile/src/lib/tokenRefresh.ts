// src/lib/tokenRefresh.ts
import { useAuthStore } from '@/stores/authStore';
import { API_BASE } from './apiBase';

export async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setTokens, clearUser } = useAuthStore.getState();
  if (!refreshToken) {
    clearUser();
    return false;
  }
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearUser();
      return false;
    }
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearUser();
    return false;
  }
}
