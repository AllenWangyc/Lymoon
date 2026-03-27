export type DayBar = { day: string; opacity: number; isToday?: boolean };

export type ScheduleCategory = 'All' | 'Shift' | 'Event' | 'Personal';

export type ScheduleItem = {
  id: string;
  title: string;
  subtitle: string;          // locally computed — NOT from API
  hours: string;
  iconBg: string;
  days: DayBar[];
  scheduleType?: 'shift' | 'event' | 'personal';
  memberPermission?: 'manager_only' | 'full_collaboration';
  startWeek?: string;        // ISO Monday date, e.g. "2026-03-16"
  currentWeek?: string;      // ISO Monday date — latest active week
  description?: string;
  inviteCode?: string;
};

export type ShiftType = 'Morning' | 'Standard' | 'Afternoon' | 'Custom';

export type Shift = {
  id: string;
  employeeId: string;
  dayOfWeek: number;  // 0 = Mon … 6 = Sun
  startTime: string;  // "09:00"
  endTime: string;    // "13:00"
  shiftType: ShiftType;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
};

export type ScheduleDetail = ScheduleItem & {
  employees: Employee[];
  shifts: Shift[];
  weekStartDate: string;      // ISO date "2024-10-14" (always a Monday)
  currentUserRole: 'Manager' | 'Member';
};
