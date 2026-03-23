import type { ScheduleItem } from '@/types/schedule';

export const SCHEDULE_CATEGORIES = ['All', 'Shared', 'Personal', 'Archived'] as const;

export const MOCK_SCHEDULES: ScheduleItem[] = [];

export const ENGINEERING_SPRINT_TEMPLATE: Omit<ScheduleItem, 'id'> = {
  title: 'Engineering Sprint',
  subtitle: 'Phase 2 • Week 42',
  scheduleType: 'shift',
  description: 'Sprint planning and daily standups for the engineering team',
  hours: '38.5',
  iconBg: 'rgba(182,236,19,0.1)',
  days: [
    { day: 'Mo', opacity: 1 },
    { day: 'Tu', opacity: 0.8 },
    { day: 'We', opacity: 1, isToday: true },
    { day: 'Th', opacity: 0.6 },
    { day: 'Fr', opacity: 1 },
    { day: 'Sa', opacity: 0 },
    { day: 'Su', opacity: 0 },
  ],
};

export const MOCK_CURRENT_USER_ID = 'emp-1';
export const MOCK_USER_ROLE: 'Manager' | 'Member' = 'Manager';

export const MOCK_EMPLOYEES: import('@/types/schedule').Employee[] = [
  { id: 'emp-1', name: 'Alex Rivera', role: 'Lead Developer', avatarInitials: 'AR' },
  { id: 'emp-2', name: 'Sarah Chen',  role: 'UI Designer',    avatarInitials: 'SC' },
];

export const MOCK_SHIFTS: import('@/types/schedule').Shift[] = [
  { id: 'shift-1', employeeId: 'emp-1', dayOfWeek: 2, startTime: '09:00', endTime: '13:00', shiftType: 'Morning' },
  { id: 'shift-2', employeeId: 'emp-2', dayOfWeek: 2, startTime: '10:00', endTime: '18:00', shiftType: 'Standard' },
  { id: 'shift-3', employeeId: 'emp-2', dayOfWeek: 2, startTime: '14:00', endTime: '18:00', shiftType: 'Afternoon' },
];

// keyed by employeeId → [currentWeek, week-1, week-2, week-3] hours
export const MOCK_WORK_HOURS_HISTORY: Record<string, number[]> = {
  'emp-1': [38.5, 42, 35, 40],
  'emp-2': [32, 28, 36, 30],
};

export const MOCK_SCHEDULE_DETAIL: import('@/types/schedule').ScheduleDetail = {
  ...ENGINEERING_SPRINT_TEMPLATE,
  id: 'schedule-1',
  memberPermission: 'full_collaboration',
  employees: MOCK_EMPLOYEES,
  shifts: MOCK_SHIFTS,
  weekStartDate: '2024-10-14',
};
