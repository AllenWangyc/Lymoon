# Sort Employees in Schedule Detail Main Area Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the same employee sort order (self → managers A–Z → members A–Z) to the main employee+shifts grid in the schedule detail screen.

**Architecture:** Reuse the existing `sortEmployees` utility. The only change is in `app/(app)/schedule/[id].tsx`: add an import and wrap the one-liner `employees` derivation on line 90. No new files, no new hooks.

**Tech Stack:** TypeScript, React Native (Expo), NativeWind — no new dependencies.

---

## File Map

| Action | File |
|--------|------|
| **Reuse** | `src/features/schedule/utils/sortEmployees.ts` (already exists, no changes) |
| **Modify** | `app/(app)/schedule/[id].tsx` (lines 1–20 for import, line 90 for sort) |

---

### Task 1: Apply sort in schedule detail screen

**Files:**
- Modify: `app/(app)/schedule/[id].tsx`

**Context:**
- `userId` is already available on line 38 via `const userId = useAuthStore((s) => s.userId!);`
- `employees` is derived on line 90: `const employees = scheduleDetail?.employees ?? [];`
- The employees array is rendered at lines 367–378 via `employees.map((employee) => <EmployeeShiftRow .../>)`
- `sortEmployees` already handles the `Employee` type exactly

- [ ] **Step 1: Add the import**

After the existing import block (after line 20 area), add:
```typescript
import { sortEmployees } from '@/features/schedule/utils/sortEmployees';
```

The existing imports end around line 27. Place this import alongside the other schedule feature imports (lines 4–16).

- [ ] **Step 2: Replace line 90**

Current code (line 90):
```typescript
  const employees = scheduleDetail?.employees ?? [];
```

Replace with:
```typescript
  const employees = sortEmployees(scheduleDetail?.employees ?? [], userId);
```

No other changes needed. `userId` is already in scope from line 38, and `sortEmployees` accepts `Employee[]` which matches `scheduleDetail?.employees`.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/schedule/[id].tsx"
git commit -m "feat(schedule): sort employee rows — self first, managers, then members"
```

---

## Verification

Open any schedule in the app and confirm:

1. **Your own row** appears at the top of the employee grid.
2. All **Manager rows** appear next, ordered A–Z by name.
3. All **Member rows** appear after managers, ordered A–Z by name.
4. Sorting is consistent across all days (day selector changes don't affect employee order — it only changes which shifts are shown per row).
