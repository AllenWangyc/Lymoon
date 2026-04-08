# Design: Member-Only Employee List Filter in Schedule Detail

**Date:** 2026-04-09  
**Branch:** feat/member-removal-ux-and-email-verification-docs  
**Scope:** Frontend only — no backend changes required

---

## Problem

In `manager_only` permission mode, regular members can only create/edit/delete their own shifts. However, the schedule detail screen currently shows all schedule members as employee rows, regardless of whether they have any shifts on the selected day. This creates unnecessary clutter for regular members, who have no reason to see rows for other members who have no shifts.

## Goal

In `manager_only` mode, regular members should only see:
1. Themselves (always)
2. Other members who have at least one shift on the currently selected day

Managers always see all members (existing behavior). `full_collaboration` mode is unaffected.

## Out of Scope

- `ViewMembersSheet` — must continue showing all members regardless of mode
- Backend — no changes needed
- `sortEmployees` utility — sort order is preserved, only filtering changes

---

## Design

### Affected File

`lymoon-mobile/app/(app)/schedule/[id].tsx`

### Change

Add a `displayEmployees` derived value via `useMemo` in the derived values section, after `employees` and `shiftsForDay` are computed:

```ts
const displayEmployees = useMemo(() => {
  const shouldFilter = !isManager && !isFullCollab;
  if (!shouldFilter) return employees;

  const employeesWithShifts = new Set(shiftsForDay.map((s) => s.employeeId));
  return employees.filter((e) => e.id === userId || employeesWithShifts.has(e.id));
}, [employees, shiftsForDay, isManager, isFullCollab, userId]);
```

Replace `employees` with `displayEmployees` in two render locations:
1. Empty state check: `employees.length === 0` → `displayEmployees.length === 0`
2. List render: `employees.map(...)` → `displayEmployees.map(...)`

### What Does NOT Change

| Location | Reason |
|---|---|
| `employees.find(...)` in `handleAddShift` | Needs full list so managers can add shifts for any member |
| `employees.find(...)` in `ShiftDetailBottomSheet` | Needs to resolve employee info for any shift |
| `ViewMembersSheet` | Uses separate `useScheduleMembers` query |
| `sortEmployees` | Sorting order preserved on filtered list |
| Backend | All data already loaded; this is a display-layer concern |

### Filter Logic Summary

| User role | Permission mode | Employee list shown |
|---|---|---|
| Manager | any | All members |
| Member | `full_collaboration` | All members |
| Member | `manager_only` | Self + members with shifts on selected day |

---

## Dependency Map

- `displayEmployees` depends on: `employees`, `shiftsForDay`, `isManager`, `isFullCollab`, `userId`
- All five are already computed before the render — no new queries needed
- Day switching (`selectedDayIndex`) already updates `shiftsForDay` via its own `useMemo`, so `displayEmployees` reacts automatically
