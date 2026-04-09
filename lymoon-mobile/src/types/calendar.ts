import type { ShiftType } from './schedule';

export type MyShift = {
  date: string;         // "YYYY-MM-DD"
  startTime: string;    // "HH:mm"
  endTime: string;      // "HH:mm"
  shiftType: ShiftType;
  scheduleId: string;
  scheduleTitle: string;
  scheduleIconBg: string;
};
