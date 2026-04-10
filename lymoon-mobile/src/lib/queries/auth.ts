// src/lib/queries/auth.ts
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { AuthResponse } from '@/types/auth';

function computeInitials(displayName: string): string {
  if (!displayName.trim()) return '?';
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
        userEmail: data.user.email,
        userRole: 'Member',
        avatarInitials: computeInitials(data.user.displayName),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}

export function useSendVerificationMutation() {
  return useMutation({
    mutationFn: (email: string) =>
      apiPost<{ ok: boolean }>('/auth/send-verification', { email }),
  });
}

export function useRegisterMutation() {
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: (vars: {
      email: string;
      password: string;
      displayName: string;
      verificationCode: string;
    }) => apiPost<AuthResponse>('/auth/register', vars),
    onSuccess: (data) => {
      setUser({
        userId: data.user.id,
        userName: data.user.displayName,
        userEmail: data.user.email,
        userRole: 'Member',
        avatarInitials: computeInitials(data.user.displayName),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}

export function useGoogleSignInMutation() {
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: (idToken: string) =>
      apiPost<AuthResponse>('/auth/google', { idToken }),
    onSuccess: (data) => {
      setUser({
        userId: data.user.id,
        userName: data.user.displayName,
        userEmail: data.user.email,
        userRole: 'Member',
        avatarInitials: computeInitials(data.user.displayName),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}

export function useAppleSignInMutation() {
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: (idToken: string) =>
      apiPost<AuthResponse>('/auth/apple', { idToken }),
    onSuccess: (data) => {
      setUser({
        userId: data.user.id,
        userName: data.user.displayName,
        userEmail: data.user.email,
        userRole: 'Member',
        avatarInitials: computeInitials(data.user.displayName),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}
