# Sort Employee List in ViewMembersSheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sort the scrollable employee list in `ViewMembersSheet` so the current user appears first, followed by Managers (alphabetically), then Members (alphabetically).

**Architecture:** Add a pure `sortEmployees` utility function in the schedule feature's utils folder, then call it inline after the existing `members.map()` in `ViewMembersSheet`. No state changes, no new hooks — just a deterministic sort over the already-fetched array.

**Tech Stack:** TypeScript, React Native (Expo), NativeWind — no new dependencies.

---

## File Map

| Action | File |
|--------|------|
| **Create** | `src/features/schedule/utils/sortEmployees.ts` |
| **Modify** | `src/features/schedule/components/ViewMembersSheet.tsx` (lines 243–248) |

---

### Task 1: Create the sort utility

**Files:**
- Create: `src/features/schedule/utils/sortEmployees.ts`

- [ ] **Step 1: Create the utility file**

```typescript
// src/features/schedule/utils/sortEmployees.ts
import type { Employee } from '@/types/schedule';

/**
 * Sort employees for display:
 *   1. Current user first
 *   2. Managers (alphabetical by name), supporting multiple managers
 *   3. Members (alphabetical by name)
 */
export function sortEmployees(employees: Employee[], currentUserId: string): Employee[] {
  return [...employees].sort((a, b) => {
    const aIsSelf = a.id === currentUserId;
    const bIsSelf = b.id === currentUserId;

    if (aIsSelf) return -1;
    if (bIsSelf) return 1;

    const aIsManager = a.role === 'Manager';
    const bIsManager = b.role === 'Manager';

    if (aIsManager && !bIsManager) return -1;
    if (!aIsManager && bIsManager) return 1;

    return a.name.localeCompare(b.name);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/schedule/utils/sortEmployees.ts
git commit -m "feat(schedule): add sortEmployees utility"
```

---

### Task 2: Apply sort in ViewMembersSheet

**Files:**
- Modify: `src/features/schedule/components/ViewMembersSheet.tsx` (lines 242–248)

- [ ] **Step 1: Replace the mapping block**

Current code at lines 242–248:
```typescript
  // Convert API member shape to Employee type
  const employees: Employee[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.scheduleRole,
    avatarInitials: m.avatarInitials,
  }));
```

Replace with:
```typescript
  // Convert API member shape to Employee type, then sort:
  //   1. Current user  2. Managers (A–Z)  3. Members (A–Z)
  const employees: Employee[] = sortEmployees(
    members.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.scheduleRole,
      avatarInitials: m.avatarInitials,
    })),
    currentUserId,
  );
```

- [ ] **Step 2: Add the import**

At the top of `ViewMembersSheet.tsx`, after the existing imports, add:
```typescript
import { sortEmployees } from '@/features/schedule/utils/sortEmployees';
```

- [ ] **Step 3: Verify the app compiles — run the dev server**

```bash
cd lymoon-mobile
npx expo start
```

Expected: No TypeScript errors, the employee list opens and shows current user first, then managers, then members.

- [ ] **Step 4: Commit**

```bash
git add src/features/schedule/components/ViewMembersSheet.tsx
git commit -m "feat(schedule): sort employee list — self first, managers, then members"
```

---

## Verification

Open the ViewMembersSheet bottom sheet in the app and confirm:

1. **Your own entry** appears at position 1.
2. All **Managers** (if any exist beyond you) appear next, ordered A–Z by name.
3. All **Members** appear after managers, ordered A–Z by name.
4. If the current user is a Manager, they still appear first (not mixed into the manager block).
