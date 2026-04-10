// src/lib/queries/account.ts
import { useMutation } from '@tanstack/react-query';
import { apiDelete, apiPatch } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

function computeInitials(displayName: string): string {
  if (!displayName.trim()) return '?';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function useUpdateDisplayNameMutation() {
  const { userId, userName, userEmail, userRole, accessToken, refreshToken, setUser } =
    useAuthStore();

  return useMutation({
    mutationFn: (displayName: string) =>
      apiPatch<{ displayName: string }>('/account/display-name', { displayName }),
    onSuccess: (data) => {
      setUser({
        userId: userId!,
        userName: data.displayName,
        userEmail: userEmail ?? '',
        userRole: userRole ?? 'Member',
        avatarInitials: computeInitials(data.displayName),
        accessToken: accessToken!,
        refreshToken: refreshToken!,
      });
    },
  });
}

export type DeleteAccountError = {
  error: 'sole_manager_blocking';
  schedules: string[];
};

export function useDeleteAccountMutation() {
  return useMutation({
    mutationFn: () => apiDelete<{}>('/account'),
  });
}
