import { create } from 'zustand';
import type { ScheduleItem, Shift, Employee } from '@/types/schedule';
import { computeDayBars, computeTotalHours } from '@/features/schedule/utils/shiftDerivedData';
import {
  MOCK_EMPLOYEES,
  MOCK_SHIFTS,
  ENGINEERING_SPRINT_TEMPLATE,
} from '@/features/schedule/constants';
import { mergeOverlappingShifts } from '@/features/schedule/utils/mergeShifts';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes ambiguous I/O/0/1
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Lazy import to avoid circular dependency — authStore → scheduleStore via seeding
function getCurrentUserId(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/stores/authStore').useAuthStore.getState().userId as string;
}

const SEED_SCHEDULE_ID = 'schedule-1';
const SEED_INVITE_CODE = 'ENG001';

const seedDays = computeDayBars(MOCK_SHIFTS, 'emp-1', new Date());

const SEED_SCHEDULE_ITEM: ScheduleItem = {
  ...ENGINEERING_SPRINT_TEMPLATE,
  id: SEED_SCHEDULE_ID,
  inviteCode: SEED_INVITE_CODE,
  days: seedDays,
  hours: computeTotalHours(MOCK_SHIFTS, 'emp-1'),
};

interface ScheduleState {
  schedules: ScheduleItem[];
  shiftsBySchedule: Record<string, Shift[]>;
  employeesBySchedule: Record<string, Employee[]>;
  pendingToast: string | null;
  showNewScheduleSheet: boolean;

  addSchedule: (item: ScheduleItem, toastMessage?: string) => void;
  removeSchedule: (scheduleId: string, toastMessage?: string) => void;
  clearPendingToast: () => void;
  setShowNewScheduleSheet: (visible: boolean) => void;

  addShiftToSchedule: (scheduleId: string, shift: Shift) => void;
  updateShiftInSchedule: (scheduleId: string, updatedShift: Shift, replacedShiftId?: string) => void;
  deleteShiftFromSchedule: (scheduleId: string, shiftId: string) => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: [SEED_SCHEDULE_ITEM],
  shiftsBySchedule: { [SEED_SCHEDULE_ID]: MOCK_SHIFTS },
  employeesBySchedule: { [SEED_SCHEDULE_ID]: MOCK_EMPLOYEES },
  pendingToast: null,
  showNewScheduleSheet: false,

  addSchedule: (item, toastMessage) =>
    set((state) => ({
      schedules: [
        ...state.schedules,
        { ...item, inviteCode: item.inviteCode ?? generateInviteCode() },
      ],
      shiftsBySchedule: { ...state.shiftsBySchedule, [item.id]: [] },
      employeesBySchedule: { ...state.employeesBySchedule, [item.id]: [] },
      pendingToast: toastMessage ?? null,
    })),

  removeSchedule: (scheduleId, toastMessage) =>
    set((state) => {
      const { [scheduleId]: _shifts, ...restShifts } = state.shiftsBySchedule;
      const { [scheduleId]: _emps, ...restEmps } = state.employeesBySchedule;
      return {
        schedules: state.schedules.filter((s) => s.id !== scheduleId),
        shiftsBySchedule: restShifts,
        employeesBySchedule: restEmps,
        pendingToast: toastMessage ?? null,
      };
    }),

  clearPendingToast: () => set({ pendingToast: null }),
  setShowNewScheduleSheet: (visible) => set({ showNewScheduleSheet: visible }),

  addShiftToSchedule: (scheduleId, shift) =>
    set((state) => {
      const currentShifts = state.shiftsBySchedule[scheduleId] ?? [];
      const newShifts = mergeOverlappingShifts(currentShifts, shift);
      return _recomputeScheduleItem(state, scheduleId, newShifts);
    }),

  updateShiftInSchedule: (scheduleId, updatedShift, replacedShiftId) =>
    set((state) => {
      const currentShifts = state.shiftsBySchedule[scheduleId] ?? [];
      const newShifts = mergeOverlappingShifts(currentShifts, updatedShift, replacedShiftId);
      return _recomputeScheduleItem(state, scheduleId, newShifts);
    }),

  deleteShiftFromSchedule: (scheduleId, shiftId) =>
    set((state) => {
      const currentShifts = state.shiftsBySchedule[scheduleId] ?? [];
      const newShifts = currentShifts.filter((s) => s.id !== shiftId);
      return _recomputeScheduleItem(state, scheduleId, newShifts);
    }),
}));

/** Recomputes days and hours for a schedule item after shifts change. */
function _recomputeScheduleItem(
  state: ScheduleState,
  scheduleId: string,
  newShifts: Shift[],
): Partial<ScheduleState> {
  const userId = getCurrentUserId();
  const updatedDays = computeDayBars(newShifts, userId, new Date());
  const updatedHours = computeTotalHours(newShifts, userId);

  return {
    shiftsBySchedule: { ...state.shiftsBySchedule, [scheduleId]: newShifts },
    schedules: state.schedules.map((s) =>
      s.id === scheduleId ? { ...s, days: updatedDays, hours: updatedHours } : s,
    ),
  };
}
