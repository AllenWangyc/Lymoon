// src/lib/queries/notifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationKeys = {
  all: ['notifications'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => apiGet<Notification[]>('/notifications'),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      apiPost<{ ok: boolean }>('/notifications/read', { notificationIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
