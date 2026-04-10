// src/lib/queries/notifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export type NotificationType =
  | 'shift_modified'
  | 'shift_deleted'
  | 'new_week_added'
  | 'removed_from_schedule'
  | 'shift_added'
  | 'member_joined'
  | 'schedule_updated';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationKeys = {
  all: ['notifications'] as const,
};

export function useNotifications() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => apiGet<Notification[]>('/notifications'),
    refetchInterval: 30_000,
    enabled: !!accessToken,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      apiPost<{ ok: boolean }>('/notifications/read', { notificationIds }),
    onMutate: async (notificationIds) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const previous = qc.getQueryData<Notification[]>(notificationKeys.all);
      qc.setQueryData<Notification[]>(notificationKeys.all, (old = []) =>
        old.map((n) => (notificationIds.includes(n.id) ? { ...n, isRead: true } : n))
      );
      return { previous };
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) {
        qc.setQueryData(notificationKeys.all, context.previous);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useDeleteAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete<void>('/notifications'),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const previous = qc.getQueryData<Notification[]>(notificationKeys.all);
      qc.setQueryData<Notification[]>(notificationKeys.all, []);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(notificationKeys.all, context.previous);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
