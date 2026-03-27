// src/lib/queries/auth.ts
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import { useAuthStore, type UserRole } from '@/stores/authStore';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string };
}

function computeInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function useLoginMutation() {
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      apiPost<AuthResponse>('/auth/login', vars),
    onSuccess: (data) => {
      setUser({
        userId: data.user.id,
        userName: data.user.displayName,
        userRole: 'Member' as UserRole, // role is per-schedule; authStore holds a fallback
        avatarInitials: computeInitials(data.user.displayName),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}

export function useRegisterMutation() {
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: (vars: { email: string; password: string; displayName: string }) =>
      apiPost<AuthResponse>('/auth/register', vars),
    onSuccess: (data) => {
      setUser({
        userId: data.user.id,
        userName: data.user.displayName,
        userRole: 'Member' as UserRole,
        avatarInitials: computeInitials(data.user.displayName),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}
