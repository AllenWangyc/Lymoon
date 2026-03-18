import { create } from 'zustand';
import type { ScheduleItem } from '@/types/schedule';

interface ScheduleState {
  schedules: ScheduleItem[];
  pendingToast: string | null;
  addSchedule: (item: ScheduleItem) => void;
  clearPendingToast: () => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: [],
  pendingToast: null,
  addSchedule: (item) =>
    set((state) => ({
      schedules: [...state.schedules, item],
      pendingToast: `Joined "${item.title}" successfully`,
    })),
  clearPendingToast: () => set({ pendingToast: null }),
}));
