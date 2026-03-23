import type { Shift } from '@/types/schedule';

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

/**
 * Merges newShift into allShifts, combining any same-employee/same-day overlapping
 * shifts into a single shift with the earliest start and latest end time.
 *
 * @param allShifts       The current full list of shifts
 * @param newShift        The shift being added or the updated version of an edited shift
 * @param replacedShiftId ID of the shift being replaced in edit mode (excluded before merge)
 */
export function mergeOverlappingShifts(
  allShifts: Shift[],
  newShift: Shift,
  replacedShiftId?: string,
): Shift[] {
  // Remove the shift being replaced (edit mode), keep everything else
  const others = allShifts.filter((s) => s.id !== replacedShiftId);

  // Find shifts for the same employee on the same day that overlap with newShift
  const overlapping = others.filter(
    (s) =>
      s.employeeId === newShift.employeeId &&
      s.dayOfWeek === newShift.dayOfWeek &&
      overlaps(newShift.startTime, newShift.endTime, s.startTime, s.endTime),
  );

  if (overlapping.length === 0) {
    return [...others, newShift];
  }

  // Merge: earliest start, latest end across newShift + all overlapping shifts
  const toMerge = [newShift, ...overlapping];
  const mergedStart = fromMinutes(Math.min(...toMerge.map((s) => toMinutes(s.startTime))));
  const mergedEnd = fromMinutes(Math.max(...toMerge.map((s) => toMinutes(s.endTime))));

  const merged: Shift = { ...newShift, startTime: mergedStart, endTime: mergedEnd };

  const overlappingIds = new Set(overlapping.map((s) => s.id));
  return [...others.filter((s) => !overlappingIds.has(s.id)), merged];
}
