// src/lib/queries/shifts.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import type { Shift, ShiftType } from '@/types/schedule';
import type { MyShift } from '@/types/calendar';
import { scheduleKeys } from './schedules';

export function useMyShifts(from: string, to: string) {
  return useQuery({
    queryKey: ['myShifts', from, to],
    queryFn: async () => {
      const list = await apiGet<MyShift[]>(`/shifts/mine?from=${from}&to=${to}`);
      const map = new Map<string, MyShift[]>();
      for (const shift of list) {
        const existing = map.get(shift.date) ?? [];
        map.set(shift.date, [...existing, shift]);
      }
      return map;
    },
  });
}

export function useAddShift(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      employeeId: string;
      dayOfWeek: number;
      weekStart: string;
      startTime: string;
      endTime: string;
      shiftType: ShiftType;
    }) => apiPost<Shift>(`/schedules/${scheduleId}/shifts`, vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
      qc.invalidateQueries({ queryKey: ['myShifts'] });
    },
  });
}

export function useUpdateShift(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      shiftId: string;
      startTime: string;
      endTime: string;
      shiftType: ShiftType;
    }) =>
      apiPost<Shift>(`/shifts/${vars.shiftId}/update`, {
        startTime: vars.startTime,
        endTime: vars.endTime,
        shiftType: vars.shiftType,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
      qc.invalidateQueries({ queryKey: ['myShifts'] });
    },
  });
}

export function useDeleteShift(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shiftId: string) =>
      apiPost<{ ok: boolean }>(`/shifts/${shiftId}/delete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
      qc.invalidateQueries({ queryKey: ['myShifts'] });
    },
  });
}
