import { create } from 'zustand';
import type { ScheduleItem } from '@/types/schedule';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes ambiguous I/O/0/1
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

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
      schedules: [...state.schedules, { ...item, inviteCode: item.inviteCode ?? generateInviteCode() }],
      pendingToast: toastMessage ?? null,
    })),
  clearPendingToast: () => set({ pendingToast: null }),
  setShowNewScheduleSheet: (visible) => set({ showNewScheduleSheet: visible }),
}));
