# Calendar Page Design Spec

**Date:** 2026-04-09
**Status:** Implemented

---

## Context

The Calendar tab (2nd item in bottom nav) was a "Coming soon" stub. This spec defines a full calendar view inspired by iOS Calendar, showing all of the current user's shifts across all schedules — the single source of truth for personal work visibility.

---

## Screen Structure

- **Header**: TopAppBar with "Calendar" title (matches existing app style)
- **Fixed weekday row**: M T W T F S S — sits below the header, never scrolls
- **Scrollable body**: Continuous vertical scroll of months. On mount, scroll position initializes to the current month.
- **Bottom tab**: Calendar (2nd item) is highlighted — this was a Figma design error only; the actual code uses Expo Router's `focused` state correctly.

---

## Calendar Grid

- Week starts Monday — matches backend convention (`dayOfWeek: 0 = Mon`)
- All months show all dates — no collapsing
- Each date cell: number centered, shift dot below if the user has ≥1 shift that day
- Cell tap with no shifts: no-op

### Today's Highlight

- Filled circle behind the number
- **Color: `#5a8a00`** — muted olive-green from the existing design system (shift-badge text color). Replaces the too-bright `#b6ec13` from Figma.
- White text inside circle
- If today also has shifts: white dot below number inside the circle (instead of colored dot) to prevent visual collision

### Shift Dots

- 5px `#b6ec13` dot below dates with shifts
- Exception: today's cell uses a white dot to avoid blending with the circle border

---

## Data Layer

**New endpoint:** `GET /api/shifts/mine?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Returns all shifts for the authenticated user across all schedules, filtered by computed date
- Computed date: `weekStart + dayOfWeek days`
- Ordered by date, then start time

**Frontend hook:** `useMyShifts(from, to)` — transforms the response into `Map<dateString, MyShift[]>` for O(1) per-cell lookup.

**Date window:** ±6 months from today, computed once at module load.

---

## Day Tap Bottom Sheet (`DayShiftSheet`)

- Opens when tapping a date with shifts
- Header: full weekday + date (e.g. "Monday, March 16")
- Per-shift card:
  - Schedule icon color dot
  - Schedule title + start → end time
  - Shift type badge (muted green, `#5a8a00` text on `rgba(182,236,19,0.15)` bg)
- Tapping a shift card navigates to that schedule's detail screen
- Dismiss: tap outside or swipe down

---

## Files Created / Modified

| File | Change |
|------|--------|
| `Lymoon.API/DTOs/Shifts/MyShiftDto.cs` | Created |
| `Lymoon.API/Services/IShiftService.cs` | Added `GetMyShiftsAsync` |
| `Lymoon.API/Services/ShiftService.cs` | Implemented `GetMyShiftsAsync` |
| `Lymoon.API/Controllers/ShiftsController.cs` | Added `GET /api/shifts/mine` |
| `lymoon-mobile/docs/API.md` | Documented new endpoint |
| `lymoon-mobile/src/types/calendar.ts` | Created `MyShift` type |
| `lymoon-mobile/src/lib/queries/shifts.ts` | Added `useMyShifts` hook |
| `lymoon-mobile/src/features/calendar/components/CalendarGrid.tsx` | Created |
| `lymoon-mobile/src/features/calendar/components/DayShiftSheet.tsx` | Created |
| `lymoon-mobile/app/(app)/calendar.tsx` | Replaced stub with full screen |
