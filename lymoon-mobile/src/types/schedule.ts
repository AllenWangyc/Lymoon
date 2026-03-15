export type DayBar = { day: string; opacity: number; isToday?: boolean };

export type ScheduleCategory = 'All' | 'Shared' | 'Personal' | 'Archived';

export type ScheduleItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  isActive: boolean;
  hours: string;
  iconBg: string;
  days: DayBar[];
};
