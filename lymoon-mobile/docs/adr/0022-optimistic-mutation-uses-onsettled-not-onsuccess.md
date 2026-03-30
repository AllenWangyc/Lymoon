# ADR-0022: Optimistic-update mutations use `onSettled` for server re-sync, not `onSuccess`

**Date**: 2026-03-30
**Status**: accepted
**Deciders**: Allen

## Context

`useMarkNotificationsRead` was initially written with `onSuccess: () => qc.invalidateQueries(...)`. When an optimistic update was added (`onMutate` applies the change locally; `onError` rolls it back), `onSuccess` was considered for triggering the server re-sync invalidation.

The problem: if the mutation request fails, `onSuccess` never fires, so `qc.invalidateQueries` is never called. The TanStack Query cache is left in the rolled-back state but is not re-fetched to confirm the actual server state. If the network error was transient and the server actually applied the change, the cache is now stale in the opposite direction.

## Decision

Any `useMutation` that includes an optimistic update (`onMutate` + `onError` rollback) must use `onSettled` — not `onSuccess` — to call `qc.invalidateQueries`. `onSettled` fires regardless of whether the mutation succeeded or failed, ensuring the cache is always reconciled with the server after the operation completes.

```typescript
useMutation({
  mutationFn: ...,
  onMutate: async (variables) => {
    await qc.cancelQueries({ queryKey });
    const previous = qc.getQueryData(queryKey);
    qc.setQueryData(queryKey, /* optimistic update */);
    return { previous };
  },
  onError: (_err, _vars, context) => {
    if (context?.previous) qc.setQueryData(queryKey, context.previous);
  },
  onSettled: () => qc.invalidateQueries({ queryKey }),  // ← always re-sync
});
```

## Alternatives Considered

### Alternative 1: Keep `onSuccess` for invalidation
- **Pros**: Avoids an extra network re-fetch on mutation failure
- **Cons**: After a failed mutation the cache holds the rolled-back optimistic state but is never re-fetched — the next natural `refetchInterval` (30 s for notifications) is the only reconciliation, leaving a potentially stale window
- **Why not**: The optimistic update and its rollback are local guesses. Server state should be confirmed as soon as possible after any mutation attempt, whether it succeeded or failed.

### Alternative 2: No optimistic update — wait for server confirmation
- **Pros**: Cache always reflects confirmed server state; no rollback logic needed
- **Cons**: Visible UI delay between tapping "Mark all read" and seeing the items update — perceptible on slower connections
- **Why not**: Optimistic updates are the correct UX pattern for low-risk idempotent writes like marking notifications read. The fix is to wire rollback + `onSettled` correctly, not to remove the optimistic update.

## Consequences

### Positive
- Cache is always reconciled with server state after a mutation, regardless of outcome
- Pattern is consistent: `onMutate` → optimistic apply; `onError` → rollback; `onSettled` → re-sync; no gaps
- Failure recovery is automatic — even after a network error, the next `onSettled` call re-fetches the true server state

### Negative
- On mutation failure, two network requests fire: the failed mutation + the `onSettled` invalidation re-fetch. This is acceptable — the extra request is cheap and correctness matters more than avoiding one round-trip on an error path.

### Risks
- Developers unfamiliar with this pattern may write `onSuccess` for invalidation on future optimistic mutations. The rule should be enforced in code review: **if `onMutate` is present, `onSettled` must be used for invalidation — never `onSuccess` alone**.
