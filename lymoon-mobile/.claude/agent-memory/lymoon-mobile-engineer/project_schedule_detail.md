---
name: Schedule Detail Feature
description: Components, types, and screen added for the schedule detail view (week navigator, day selector, shift cards, employee rows)
type: project
---

Schedule detail screen implemented at `app/(app)/schedule/[id].tsx` with a Stack layout at `app/(app)/schedule/_layout.tsx`.

**New types added to `src/types/schedule.ts`:** `ShiftType`, `Shift`, `Employee`, `ScheduleDetail` (extends `ScheduleItem`).

**New mock constants added to `src/features/schedule/constants.ts`:** `MOCK_CURRENT_USER_ID`, `MOCK_USER_ROLE`, `MOCK_EMPLOYEES`, `MOCK_SHIFTS`, `MOCK_SCHEDULE_DETAIL`.

**New components in `src/features/schedule/components/`:**
- `WeekNavigator` — prev/next week arrows + "Next Week" button (Manager only)
- `DaySelector` — 7-day pill selector; selected day highlighted with `#b6ec13` background
- `ShiftCard` — displays shift type label + time range
- `AddShiftSlot` — dashed placeholder button for adding a shift
- `EmployeeShiftRow` — avatar + name/role header + horizontal scroll of ShiftCards + AddShiftSlot

**ScheduleCard modified** to accept `id: string` prop and navigate via `router.push('/schedule/${id}')` on "View Details" press.

**Why:** MVP schedule detail screen so managers and members can view/navigate shifts by day and week.

**How to apply:** When wiring the real API, replace `MOCK_SCHEDULE_DETAIL` usage in `[id].tsx` with a `useScheduleDetail(id)` TanStack Query hook in `lib/queries/schedules.ts`. The `id` param is read via `useLocalSearchParams<{ id: string }>()`.
