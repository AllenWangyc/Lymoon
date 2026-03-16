import type { ScheduleItem } from '@/types/schedule';

export const SCHEDULE_CATEGORIES = ['All', 'Shared', 'Personal', 'Archived'] as const;

export const MOCK_SCHEDULES: ScheduleItem[] = [];

export const ENGINEERING_SPRINT_TEMPLATE: Omit<ScheduleItem, 'id'> = {
  title: 'Engineering Sprint',
  subtitle: 'Phase 2 • Week 42',
  status: 'Active',
  isActive: true,
  hours: '38.5 hrs',
  iconBg: 'rgba(182,236,19,0.1)',
  days: [
    { day: 'M', opacity: 1 },
    { day: 'T', opacity: 0.8 },
    { day: 'W', opacity: 1, isToday: true },
    { day: 'T', opacity: 0.6 },
    { day: 'F', opacity: 1 },
    { day: 'S', opacity: 0 },
    { day: 'S', opacity: 0 },
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

export const MOCK_SCHEDULE_DETAIL: import('@/types/schedule').ScheduleDetail = {
  ...ENGINEERING_SPRINT_TEMPLATE,
  id: 'schedule-1',
  employees: MOCK_EMPLOYEES,
  shifts: MOCK_SHIFTS,
  weekStartDate: '2024-10-14',
};
