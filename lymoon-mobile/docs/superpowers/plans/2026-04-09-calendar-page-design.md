# Calendar Page Design & Implementation Plan

## Context

The Lymoon mobile app has a Calendar tab (2nd item in bottom nav) that currently shows a "Coming soon" stub. This plan implements a full calendar view inspired by iOS Calendar, showing all of the current user's shifts across all their schedules. The goal is a clean at-a-glance overview of the user's work life with shift-dot indicators and a day-tap bottom sheet.

---

## Design Spec

### Screen Structure

- **Header**: TopAppBar with "Calendar" title (matches existing app style)
- **Fixed weekday row**: M T W T F S S — sticky below the header, blurred background
- **Scrollable body**: Continuous vertical scroll of months, each with a bold month heading and a full 7-column date grid
- **Bottom tab**: Calendar (2nd item) highlighted — fix current bug where Home is incorrectly highlighted

### Calendar Grid

- Week starts Monday (matches backend `dayOfWeek: 0 = Mon`)
- All months show ALL dates — no collapsing for any month
- On mount, scroll position is initialized to center the current month in view
- Each date cell: number centered, shift dot below if shifts exist that day

### Today's Highlight

- Today's date gets a filled circle background behind the number
- **Color: `#5a8a00`** (muted olive-green, already in the design system as shift-badge text color) — replaces the too-bright `#b6ec13` from Figma
- White text inside the circle
- If today also has shifts: show a **white dot** inside the circle (below the number) instead of the usual colored dot, to avoid visual collision

### Shift Dots

- Small `#b6ec13` dot centered below each date that has ≥1 shift
- Exception: today's cell uses a white dot (see above)

### Day Tap Bottom Sheet (`DayShiftSheet`)

- Triggered by tapping any date with shifts; tapping a date with no shifts does nothing
- Header: weekday + full date (e.g. "Monday, March 16")
- List of shift cards:
  - Schedule icon color dot + schedule title
  - Start → End time (e.g. "09:00 → 17:00")
  - Shift type badge
- Tapping a shift card navigates to that schedule's detail screen
- Dismiss: swipe down or tap outside

---

## Implementation Plan

### Step 1 — Backend: New API endpoint

**File:** `Lymoon.API/Controllers/ShiftsController.cs`
**File:** `Lymoon.API/Services/IShiftService.cs` + `ShiftService.cs`
**File:** `Lymoon.API/DTOs/Shifts/MyShiftDto.cs`

Add endpoint:
```
GET /api/shifts/mine?from=2026-01-01&to=2026-12-31
```

- Requires `[Authorize]`
- Queries all `schedule_members` rows for the current user → collects `scheduleId`s
- Queries all `shifts` where `scheduleId IN (...)` AND `userId == currentUserId` AND computed date in `[from, to]`
- Computed date: `weekStart + dayOfWeek days` (dayOfWeek 0=Mon)
- Response DTO per shift:
  ```json
  {
    "date": "2026-03-16",
    "startTime": "09:00",
    "endTime": "17:00",
    "shiftType": "Standard",
    "scheduleId": "...",
    "scheduleTitle": "Main Store",
    "scheduleIconBg": "#b6ec13"
  }
  ```
- Document in `docs/API.md`

### Step 2 — Frontend: Query hook

**File:** `lymoon-mobile/src/lib/queries/shifts.ts`

Add `useMyShifts(from: string, to: string)`:
- Calls `GET /api/shifts/mine?from={from}&to={to}`
- Query key: `['myShifts', from, to]`
- Transform response into `Map<string, MyShift[]>` where key is `"YYYY-MM-DD"` date string

**File:** `lymoon-mobile/src/types/calendar.ts`

Add type:
```typescript
export type MyShift = {
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  scheduleId: string;
  scheduleTitle: string;
  scheduleIconBg: string;
};
```

### Step 3 — Frontend: CalendarGrid component

**New file:** `lymoon-mobile/src/features/calendar/components/CalendarGrid.tsx`

Props:
```typescript
{
  year: number;
  month: number; // 0-indexed
  shiftMap: Map<string, MyShift[]>;
  onDayPress: (date: string, shifts: MyShift[]) => void;
}
```

Logic:
- Use `date-fns`: `startOfMonth`, `getDaysInMonth`, `getDay`, `format`
- Build 7-column grid with Monday offset: `(getDay(firstDay) + 6) % 7`
- Render each day cell:
  - Today: filled `#5a8a00` circle, white text
  - Has shifts (not today): `#b6ec13` dot below
  - Has shifts (today): white dot below inside circle
  - No shifts: plain number

### Step 4 — Frontend: DayShiftSheet component

**New file:** `lymoon-mobile/src/features/calendar/components/DayShiftSheet.tsx`

Props:
```typescript
{
  visible: boolean;
  date: string | null;
  shifts: MyShift[];
  onClose: () => void;
  onShiftPress: (scheduleId: string) => void;
}
```

- Uses existing `BottomSheet` component
- Header: formatted date string via `date-fns` `format(parseISO(date), 'EEEE, MMMM d')`
- Shift card list with schedule color dot, title, times, shift type badge

### Step 5 — Frontend: CalendarScreen

**File:** `lymoon-mobile/app/(app)/calendar.tsx` (replace stub)

- Fetch `useMyShifts` with `from = 6 months ago`, `to = 6 months ahead` (computed once at module load)
- Build array of `{ year, month }` for the ±6 month range
- Render `SafeAreaView` with:
  - Fixed app bar ("Calendar" title)
  - Fixed weekday header row (M T W T F S S)
  - `ScrollView` with month sections: bold heading + `<CalendarGrid />`
- On mount: use `onLayout` on the current month section + `scrollRef.scrollTo()` to scroll into view
- State: `selectedDate`, `selectedShifts`, `sheetVisible` → drives `<DayShiftSheet />`
- On shift card press: `router.push('/(app)/schedule/${scheduleId}')`

### Step 6 — Fix bottom nav highlight bug

**File:** `lymoon-mobile/src/components/CustomTabBar.tsx`

The active tab color is driven by Expo Router's `state.routes[state.index]?.name` — already correct in code. The bug was Figma-only; no code change needed.

---

## Files Created / Modified

| File | Action |
|------|--------|
| `Lymoon.API/DTOs/Shifts/MyShiftDto.cs` | Created |
| `Lymoon.API/Services/IShiftService.cs` | Modified (added `GetMyShiftsAsync`) |
| `Lymoon.API/Services/ShiftService.cs` | Modified (implemented `GetMyShiftsAsync`) |
| `Lymoon.API/Controllers/ShiftsController.cs` | Modified (added `GET /api/shifts/mine`) |
| `lymoon-mobile/docs/API.md` | Modified (documented new endpoint) |
| `lymoon-mobile/src/types/calendar.ts` | Created |
| `lymoon-mobile/src/lib/queries/shifts.ts` | Modified (added `useMyShifts` hook) |
| `lymoon-mobile/src/features/calendar/components/CalendarGrid.tsx` | Created |
| `lymoon-mobile/src/features/calendar/components/DayShiftSheet.tsx` | Created |
| `lymoon-mobile/app/(app)/calendar.tsx` | Modified (replaced stub) |

---

## Verification

1. Run backend: `cd Lymoon.API && dotnet run`
2. Test `GET /api/shifts/mine?from=2026-01-01&to=2026-12-31` with a valid JWT — confirm shifts from all user's schedules are returned
3. Run mobile: `cd lymoon-mobile && npx expo start`
4. Navigate to Calendar tab — confirm:
   - Calendar tab icon is highlighted (not Home)
   - Current month is centered on load
   - Today's date shows muted green circle (`#5a8a00`)
   - Dates with shifts show `#b6ec13` dot
   - Tapping a shift-date opens bottom sheet with correct shift data
   - Tapping a shift card in the sheet navigates to the schedule
   - All months show full date grids (no collapsing)
