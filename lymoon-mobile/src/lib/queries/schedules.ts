// src/lib/queries/schedules.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { apiGet, apiPost } from '@/lib/api';
import type { ScheduleItem, ScheduleDetail, Employee, ShiftType, SchedulePreview } from '@/types/schedule';

// ─── Response shapes from API ────────────────────────────────────────────────

interface ApiScheduleItem {
  id: string;
  title: string;
  hours: string;
  iconBg: string;
  days: { day: string; opacity: number; isToday: boolean }[];
  scheduleType: 'shift' | 'event' | 'personal';
  memberPermission: 'manager_only' | 'full_collaboration';
  startWeek: string;
  currentWeek: string;
  description: string | null;
  inviteCode: string;
}

function toScheduleItem(raw: ApiScheduleItem): ScheduleItem {
  const week = raw.currentWeek ? new Date(raw.currentWeek) : new Date();
  const typeLabel = raw.scheduleType.charAt(0).toUpperCase() + raw.scheduleType.slice(1);
  return {
    id: raw.id,
    title: raw.title,
    hours: raw.hours,
    iconBg: raw.iconBg,
    days: raw.days,
    scheduleType: raw.scheduleType,
    memberPermission: raw.memberPermission,
    startWeek: raw.startWeek,
    currentWeek: raw.currentWeek,
    inviteCode: raw.inviteCode,
    description: raw.description ?? undefined,
    subtitle: `${typeLabel} • ${format(week, 'MMM d')}`,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const scheduleKeys = {
  all: ['schedules'] as const,
  detail: (id: string) => ['schedules', id] as const,
  members: (id: string) => ['schedules', id, 'members'] as const,
  workHours: (scheduleId: string, userId: string) =>
    ['schedules', scheduleId, 'members', userId, 'work-hours'] as const,
};

export function useSchedules() {
  return useQuery({
    queryKey: scheduleKeys.all,
    queryFn: () => apiGet<ApiScheduleItem[]>('/schedules').then((items) => items.map(toScheduleItem)),
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      title: string;
      description: string | null;
      scheduleType: 'shift' | 'event' | 'personal';
      startWeek: string;
      memberPermission: 'manager_only' | 'full_collaboration';
      iconBg: string;
    }) => apiPost<ApiScheduleItem>('/schedules', vars).then(toScheduleItem),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  });
}

export function useScheduleDetail(id: string, weekStart?: string) {
  return useQuery({
    queryKey: [...scheduleKeys.detail(id), weekStart ?? 'current'],
    queryFn: async () => {
      const path = weekStart
        ? `/schedules/${id}?weekStart=${weekStart}`
        : `/schedules/${id}`;
      const raw = await apiGet<ApiScheduleItem & {
        weekStartDate: string;
        currentUserRole: 'Manager' | 'Member';
        employees: Employee[];
        shifts: {
          id: string;
          employeeId: string;
          dayOfWeek: number;
          startTime: string;
          endTime: string;
          shiftType: ShiftType;
        }[];
      }>(path);
      const base = toScheduleItem(raw);
      return {
        ...base,
        weekStartDate: raw.weekStartDate,
        currentUserRole: raw.currentUserRole,
        employees: raw.employees,
        shifts: raw.shifts,
      } as ScheduleDetail & { currentUserRole: 'Manager' | 'Member' };
    },
    enabled: !!id,
  });
}

export function useAddNextWeek(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiPost<{ currentWeek: string }>(`/schedules/${scheduleId}/weeks`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useRenameSchedule(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      apiPost<{ ok: boolean }>(`/schedules/${scheduleId}/rename`, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useLeaveSchedule(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiPost<{ ok: boolean }>(`/schedules/${scheduleId}/leave`),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  });
}

export function useScheduleLookup() {
  return useMutation({
    mutationFn: (code: string) =>
      apiGet<SchedulePreview>(
        `/schedules/lookup?code=${encodeURIComponent(code)}`,
      ),
  });
}

export function useJoinSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) =>
      apiPost<{ id: string; title: string; managerName: string; memberCount: number }>(
        '/schedules/join',
        { inviteCode },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  });
}

export function useScheduleMembers(scheduleId: string) {
  return useQuery({
    queryKey: scheduleKeys.members(scheduleId),
    queryFn: () =>
      apiGet<{
        id: string;
        name: string;
        role: string;
        avatarInitials: string;
        scheduleRole: 'Manager' | 'Member';
      }[]>(`/schedules/${scheduleId}/members`),
    enabled: !!scheduleId,
  });
}

export function useWorkHours(scheduleId: string, userId: string) {
  return useQuery({
    queryKey: scheduleKeys.workHours(scheduleId, userId),
    queryFn: () =>
      apiGet<{ weekStart: string; weekEnd: string; totalHours: number }[]>(
        `/schedules/${scheduleId}/members/${userId}/work-hours`,
      ),
    enabled: !!scheduleId && !!userId,
  });
}

export function useRemoveMember(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiPost<{ ok: boolean }>(`/schedules/${scheduleId}/members/remove`, { userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.members(scheduleId) }),
  });
}
