import { create } from 'zustand';
import type { ScheduleItem } from '@/types/schedule';

interface ScheduleState {
  schedules: ScheduleItem[];
  pendingToast: string | null;
  showNewScheduleSheet: boolean;
  addSchedule: (item: ScheduleItem, toastMessage?: string) => void;
  clearPendingToast: () => void;
  setShowNewScheduleSheet: (visible: boolean) => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: [],
  pendingToast: null,
  showNewScheduleSheet: false,
  addSchedule: (item, toastMessage) =>
    set((state) => ({
      schedules: [...state.schedules, item],
      pendingToast: toastMessage ?? `Created "${item.title}" successfully`,
    })),
  clearPendingToast: () => set({ pendingToast: null }),
  setShowNewScheduleSheet: (visible) => set({ showNewScheduleSheet: visible }),
}));
