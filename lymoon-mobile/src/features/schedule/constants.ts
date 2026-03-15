import type { ScheduleItem } from '../../types/schedule';

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
