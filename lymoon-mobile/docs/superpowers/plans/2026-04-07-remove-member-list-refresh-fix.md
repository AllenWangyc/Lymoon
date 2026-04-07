# Remove Member — List Refresh Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a Manager removes a member, the ViewMembersSheet list updates instantly instead of waiting for a background refetch.

**Architecture:** Replace `invalidateQueries` for the members list with `setQueryData` — immediately splice the removed member out of the cached array. Keep `invalidateQueries` for the schedule detail so the EmployeeShiftRow list on the main page also syncs.

**Tech Stack:** TanStack Query v5 `setQueryData`, TypeScript

------

## Context

`useRemoveMember` currently calls `qc.invalidateQueries` on success. `invalidateQueries` marks the query stale and triggers a background refetch — but the old data stays rendered until the refetch resolves. This causes the removed member to remain visible in the ViewMembersSheet list for a noticeable delay.

The fix: in `onSuccess`, call `qc.setQueryData` to immediately remove the member from the `members` cache, then still invalidate the detail query so the EmployeeShiftRow list on the schedule detail page also updates.

------

## Files

- Modify: `lymoon-mobile/src/lib/queries/schedules.ts` — `useRemoveMember` function (lines 187–197)

------

## Task 1: Fix `useRemoveMember` to update the members cache immediately

**Files:**

- Modify: `lymoon-mobile/src/lib/queries/schedules.ts`

The member shape returned by `GET /schedules/{id}/members` (used as the cached type):

```
{
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  scheduleRole: 'Manager' | 'Member';
}
```

-  **Step 1: Open the file**

Read `lymoon-mobile/src/lib/queries/schedules.ts`, lines 187–197.

-  **Step 2: Replace onSuccess in useRemoveMember**

Replace:

```
export function useRemoveMember(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiPost<{ ok: boolean }>(`/schedules/${scheduleId}/members/remove`, { userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.members(scheduleId) });
      qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
    },
  });
}
```

With:

```
type MemberDto = {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  scheduleRole: 'Manager' | 'Member';
};

export function useRemoveMember(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiPost<{ ok: boolean }>(`/schedules/${scheduleId}/members/remove`, { userId }),
    onSuccess: (_data, userId) => {
      qc.setQueryData<MemberDto[]>(
        scheduleKeys.members(scheduleId),
        (old) => old?.filter((m) => m.id !== userId) ?? [],
      );
      qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
    },
  });
}
```

-  **Step 3: Verify TypeScript compiles**

```
cd lymoon-mobile && npx tsc --noEmit
```

Expected: no errors related to `schedules.ts`.

-  **Step 4: Commit**

```
git add lymoon-mobile/src/lib/queries/schedules.ts
git commit -m "fix(schedule): instantly remove member from list after removal"
```

------

## Verification

Manual test steps:

1. Open a schedule as a Manager.
2. Tap the `⋯` menu → "View Members".
3. Tap the three-dot icon on any member → "Remove" → confirm.
4. **Expected:** The member disappears from the list immediately (no delay), and a "Member removed" toast appears.
5. Close and reopen the members sheet — the removed member is still gone.
6. The schedule detail page's employee list also no longer shows the removed member (may take one refetch cycle).