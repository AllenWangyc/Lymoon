import type { Shift } from '@/types/schedule';
import type { DayBar } from '@/types/schedule';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function shiftDurationHours(shift: Shift): number {
  const [sh, sm] = shift.startTime.split(':').map(Number);
  const [eh, em] = shift.endTime.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

/**
 * Derives a 7-element DayBar array from a list of shifts for a specific user.
 * Days with a shift get opacity proportional to hours worked (longer = more opaque).
 * Days without shifts get opacity 0 (displayed as grey).
 *
 * Opacity scale: 0.5h → 0.3, 4h → 0.7, 8h+ → 1.0 (capped)
 */
export function computeDayBars(shifts: Shift[], userId: string, today?: Date): DayBar[] {
  const todayIndex = today ? (today.getDay() === 0 ? 6 : today.getDay() - 1) : -1;

  return DAY_LABELS.map((day, dayIndex) => {
    const dayShifts = shifts.filter(
      (s) => s.employeeId === userId && s.dayOfWeek === dayIndex,
    );

    const totalHours = dayShifts.reduce((sum, s) => sum + shiftDurationHours(s), 0);

    let opacity = 0;
    if (totalHours > 0) {
      // Map hours to opacity: minimum 0.35 for any shift, scales to 1.0 at 8h+
      opacity = Math.min(1.0, 0.35 + (totalHours / 8) * 0.65);
    }

    return {
      day,
      opacity,
      isToday: dayIndex === todayIndex,
    };
  });
}

/**
 * Computes the total scheduled hours for a specific user across all shifts.
 */
export function computeTotalHours(shifts: Shift[], userId: string): string {
  const total = shifts
    .filter((s) => s.employeeId === userId)
    .reduce((sum, s) => sum + shiftDurationHours(s), 0);

  if (total === 0) return '0';
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  return m > 0 ? `${h}.${Math.round((m / 60) * 10)}` : `${h}`;
}
