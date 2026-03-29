# ADR-0015: `useScheduleLookup` implemented as `useMutation`, not `useQuery`

**Date**: 2026-03-29
**Status**: accepted
**Deciders**: Allen

## Context

`useScheduleLookup` calls `GET /schedules/lookup?code=...` to preview a schedule before a user decides to join. The underlying HTTP verb is GET, which would ordinarily suggest `useQuery`. However, the call is triggered explicitly by a user pressing a "Look up" button — it should not run on mount, should not be refetched in the background, and its result is discarded once the user navigates away.

## Decision

`useScheduleLookup` uses `useMutation` despite calling a read-only GET endpoint. The `mutationFn` issues the `apiGet` call. The lookup result lives in the mutation's `data` field and is never cached.

## Alternatives Considered

### Alternative 1: `useQuery` with `enabled: false` and manual `refetch()`
- **Pros**: Consistent — read operations use `useQuery`
- **Cons**: Requires `enabled: false` to prevent auto-fetch, then calling `refetch()` imperatively. The result is cached under a query key and must be explicitly invalidated when the component unmounts — overhead for a one-shot operation.
- **Why not**: Over-engineered for a single user-triggered preview; cache entry is meaningless here

### Alternative 2: Direct `apiGet` call inside a `useState` / event handler
- **Pros**: Simplest possible implementation; no TanStack Query overhead
- **Cons**: No loading/error state management from the library; requires manual `isLoading` and `error` state; bypasses the convention that all API calls flow through query hooks
- **Why not**: Violates the project rule that all server interactions go through `lib/queries/` hooks

## Consequences

### Positive
- `isLoading`, `isError`, `data`, and `reset()` are provided by `useMutation` with no extra state management
- No stale cache entry to clean up; result is inherently transient
- Consistent with other one-shot, user-triggered operations (e.g. `useJoinSchedule`)

### Negative
- Slightly surprising to use a mutation for a GET — developers must know this pattern is intentional
- Result is not cached; if the user triggers the lookup twice with the same code, two network requests are made

### Risks
- Future developers may replace with `useQuery` thinking it's more "correct" — this ADR serves as the canonical explanation
