import { create } from 'zustand';
import type { ScheduleItem } from '@/types/schedule';

interface ScheduleState {
  schedules: ScheduleItem[];
  pendingToast: string | null;
  addSchedule: (item: ScheduleItem, toastMessage?: string) => void;
  clearPendingToast: () => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: [],
  pendingToast: null,
  addSchedule: (item, toastMessage) =>
    set((state) => ({
      schedules: [...state.schedules, item],
      pendingToast: toastMessage ?? `Created "${item.title}" successfully`,
    })),
  clearPendingToast: () => set({ pendingToast: null }),
}));
