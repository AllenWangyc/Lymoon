# Code Review — Task 7 & Task 8 (Frontend API Integration)

**Date:** 2026-03-29
**Reviewer:** everything-claude-code:typescript-reviewer
**Files reviewed:**
- `lymoon-mobile/src/lib/queries/schedules.ts` (Task 7 — new file)
- `lymoon-mobile/app/(app)/index.tsx` (Task 8 — modified file)

**TypeScript check:** PASS (strict mode, zero errors)

---

## Issues

### [HIGH] #1 — `shiftType: string` violates `Shift.shiftType: ShiftType`, hidden by `as` cast

**File:** `src/lib/queries/schedules.ts`, lines 82, 92

Inside `useScheduleDetail`'s `queryFn`, the inline API response shape declares:
```typescript
shiftType: string;
```

But `Shift` in `src/types/schedule.ts` defines:
```typescript
shiftType: ShiftType;  // 'Morning' | 'Standard' | 'Afternoon' | 'Custom'
```

The final `as ScheduleDetail & { currentUserRole: 'Manager' | 'Member' }` cast on line 92 suppresses the type error. Any consumer passing `shiftType` to code expecting `ShiftType` will be silently unsound.

**Fix:** Change the inline shape to use `ShiftType` instead of `string`.

---

### [HIGH] #2 — `undefined` in query key breaks prefix-based cache invalidation

**File:** `src/lib/queries/schedules.ts`, line 67

```typescript
queryKey: [...scheduleKeys.detail(id), weekStart],
```

When `weekStart` is `undefined`, the key becomes `['schedules', id, undefined]`. TanStack Query v5 treats this as distinct from `['schedules', id]`. As a result, `invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) })` in `useAddNextWeek` (line 104) and `useRenameSchedule` (line 116) will **not** invalidate the "current week" detail cache entry, leaving the UI stale after those mutations.

**Fix:** Use a sentinel value instead of `undefined`, e.g. `weekStart ?? 'current'`.

---

### [MEDIUM] #3 — No error state in home screen — API failure shown as empty list

**File:** `app/(app)/index.tsx`, line 23

```typescript
const { data: schedules = [], isLoading: schedulesLoading } = useSchedules();
```

`isError` is not destructured and no error UI is rendered. When the `/schedules` request fails, the user sees "No active schedules yet" instead of an error message.

**Fix:** Destructure `isError` and render an error state in the schedule list section.

---

### [MEDIUM] #4 — Incomplete `useEffect` dependency arrays

**File:** `app/(app)/index.tsx`, lines 25–37

```typescript
useEffect(() => {
  if (pendingToast) {
    showToast(pendingToast);
    clearPendingToast();
  }
}, [pendingToast]);  // missing: showToast, clearPendingToast

useEffect(() => {
  if (showNewScheduleSheet) {
    setSheetVisible(true);
    setShowNewScheduleSheet(false);
  }
}, [showNewScheduleSheet]);  // missing: setShowNewScheduleSheet
```

Zustand actions are referentially stable so this won't cause bugs today, but it is an exhaustive-deps violation and a maintenance trap.

**Fix:** Add the missing functions to the dependency arrays.

---

### [MEDIUM] #5 — `useScheduleLookup` uses `useMutation` for a GET request

**File:** `src/lib/queries/schedules.ts`, lines 131–138

`useScheduleLookup` calls `apiGet` but is implemented as a `useMutation`. The result is never cached — every call is a network round trip, even for repeated identical codes. Read semantics should use `useQuery`.

**Fix:** Refactor to `useQuery` with `enabled: !!code` and the code in the query key, or a lazy query pattern.

---

### [MEDIUM] #6 — `toScheduleItem` spreads full API shape — leaky mapping boundary

**File:** `src/lib/queries/schedules.ts`, lines 26–31

```typescript
return {
  ...raw,
  description: raw.description ?? undefined,
  subtitle: `${typeLabel} • ${format(week, 'MMM d')}`,
};
```

All API fields are passed through directly. Future server additions will bleed into the domain object silently. Explicit field-by-field mapping would catch schema drift at compile time.

**Fix:** Replace the spread with an explicit object that names each field.

---

### [LOW] #7 — Mock data not cleaned up in `constants.ts`

**File:** `src/features/schedule/constants.ts`

`MOCK_SCHEDULES` is now an empty array, but the following exports still exist and are dead code after the API migration:
- `MOCK_SCHEDULE_DETAIL`
- `MOCK_EMPLOYEES`
- `MOCK_SHIFTS`
- `MOCK_WORK_HOURS_HISTORY`
- `MOCK_CURRENT_USER_ID`
- `MOCK_USER_ROLE`
- `ENGINEERING_SPRINT_TEMPLATE`

The plan (File Map section) lists removing these from `constants.ts` as part of this integration.

**Fix:** Delete all `MOCK_*` exports and `ENGINEERING_SPRINT_TEMPLATE`. Verify no remaining screen imports them before deleting.

---

### [LOW] #8 — Magic numbers in `headerHeight` calculation

**File:** `app/(app)/index.tsx`, line 51

```typescript
const headerHeight = insets.top + 8 + 56 + 16;
```

The values `8`, `56`, and `16` are unexplained. The comment partially documents intent but does not make the values refactor-safe. (Pre-existing issue, not introduced by Task 8.)

**Fix:** Extract as named constants, e.g. `HEADER_TOP_PADDING`, `HEADER_GREETING_HEIGHT`, `HEADER_BOTTOM_PADDING`.

---

## Summary

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 1 | **HIGH** | `schedules.ts:82,92` | `shiftType: string` violates `ShiftType` union; hidden by `as` cast |
| 2 | **HIGH** | `schedules.ts:67` | `undefined` in query key breaks prefix invalidation in `useAddNextWeek` / `useRenameSchedule` |
| 3 | MEDIUM | `index.tsx:23` | No error state — API failure silently shows empty list |
| 4 | MEDIUM | `index.tsx:25–37` | Incomplete `useEffect` dependency arrays |
| 5 | MEDIUM | `schedules.ts:131–138` | `useScheduleLookup` uses `useMutation` for a GET — no caching |
| 6 | MEDIUM | `schedules.ts:26–31` | `toScheduleItem` spread leaks full API shape into domain type |
| 7 | LOW | `constants.ts` | Mock data exports not removed — plan compliance gap |
| 8 | LOW | `index.tsx:51` | Magic numbers in `headerHeight` |
