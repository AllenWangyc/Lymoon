# ADR-0019: Auth-gated `enabled` flag on polling queries

**Date**: 2026-03-30
**Status**: accepted
**Deciders**: Allen

## Context

`useNotifications` runs `refetchInterval: 30_000` to poll the backend every 30 seconds. Without an `enabled` guard, the query fires immediately on app mount — including during the brief window after logout where Zustand has cleared the tokens but the component tree has not yet unmounted. This results in unauthenticated requests hitting `/api/notifications`, which the backend rejects with 401. The token-refresh flow in `api.ts` then calls `clearUser()`, potentially cascading into an unwanted auth state reset even during a legitimate logged-out session.

## Decision

Any TanStack Query hook that polls (`refetchInterval`) or that would meaningfully fire on app mount must include `enabled: !!accessToken` read from `authStore`. The `accessToken` selector is read inside the hook itself — screens do not pass an `enabled` prop.

```typescript
export function useNotifications() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => apiGet<Notification[]>('/notifications'),
    refetchInterval: 30_000,
    enabled: !!accessToken,
  });
}
```

## Alternatives Considered

### Alternative 1: Rely on 401 handling in `api.ts`
- **Pros**: Simpler hook code; no Zustand import in the query file
- **Cons**: Unauthenticated requests still fire and hit the network; 401 triggers the refresh path, which calls `clearUser()` — a side effect with a higher blast radius than simply not firing the query
- **Why not**: The 401 handler was designed for *expired* tokens mid-session, not for unauthenticated startup polling. Conflating these two states makes the auth flow harder to reason about.

### Alternative 2: Unmount the query consumer on logout at the layout level
- **Pros**: Guarantees the query never fires while logged out
- **Cons**: Relies on layout/routing correctness as a safety net; fragile if the component tree changes; doesn't protect against the brief unmount race
- **Why not**: Defense in depth is better here — the query hook should be self-contained and not depend on the routing layer for correctness.

## Consequences

### Positive
- No unauthenticated network requests from polling queries after logout
- Auth state transitions are cleaner — `clearUser()` is only called by the intended path (refresh failure), not as a side effect of background polls
- Pattern is self-documenting: any future developer reading the hook immediately sees the auth dependency

### Negative
- Adds a Zustand import to query hook files; slight coupling between the data layer and auth store
- Must be remembered for every future hook that uses `refetchInterval` or fires on mount in an authenticated context

### Risks
- If `accessToken` is briefly `null` during a token rotation (the window between `clearUser` and `setTokens` in the refresh path), the query will stop and then immediately restart. This is acceptable for a polling interval of 30 seconds.
