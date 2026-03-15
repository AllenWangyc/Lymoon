import type { ScheduleItem } from '../../types/schedule';

export const SCHEDULE_CATEGORIES = ['All', 'Shared', 'Personal', 'Archived'] as const;

// TODO: replace with React Query once API is ready
export const MOCK_SCHEDULES: ScheduleItem[] = [
  {
    id: '1',
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
  },
  {
    id: '2',
    title: 'Marketing Campaign',
    subtitle: 'Q4 Launch • Week 42',
    status: 'Shared',
    isActive: false,
    hours: '20.0 hrs',
    iconBg: '#f1f5f9',
    days: [
      { day: 'M', opacity: 0.4 },
      { day: 'T', opacity: 0.4 },
      { day: 'W', opacity: 0.4, isToday: true },
      { day: 'T', opacity: 0.4 },
      { day: 'F', opacity: 0.4 },
      { day: 'S', opacity: 0 },
      { day: 'S', opacity: 0 },
    ],
  },
];
