// src/stores/scheduleStore.ts
import { create } from 'zustand';

interface ScheduleUIState {
  pendingToast: string | null;
  showNewScheduleSheet: boolean;
  clearPendingToast: () => void;
  setShowNewScheduleSheet: (visible: boolean) => void;
  setPendingToast: (message: string) => void;
}

export const useScheduleStore = create<ScheduleUIState>((set) => ({
  pendingToast: null,
  showNewScheduleSheet: false,
  clearPendingToast: () => set({ pendingToast: null }),
  setShowNewScheduleSheet: (visible) => set({ showNewScheduleSheet: visible }),
  setPendingToast: (message) => set({ pendingToast: message }),
}));
