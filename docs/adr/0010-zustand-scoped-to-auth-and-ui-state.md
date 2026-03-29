# ADR-0010: Zustand Scoped to Auth Tokens and Ephemeral UI State Only

**Date**: 2026-03-28
**Status**: accepted
**Deciders**: Allen

## Context

The app originally used Zustand to hold both authentication state and schedule/shift server data (mock seed data in `scheduleStore`). As the project moves from mocked data to real API calls, we need to decide how to partition client state between Zustand and TanStack Query.

Mixing server state into Zustand creates duplicate sources of truth: Zustand holds a snapshot that grows stale, while TanStack Query would hold the authoritative cache. Every mutation would need to update both stores, and cache invalidation logic would leak into the UI layer.

## Decision

Zustand is restricted to two categories of state:
1. **Auth state** — `accessToken`, `refreshToken`, `userId`, `userName`, `userRole`, `avatarInitials`, `isAuthenticated`
2. **Ephemeral UI state** — transient flags such as `pendingToast` and `showNewScheduleSheet` that have no server representation

All server-originated data (schedules, shifts, notifications, members) lives exclusively in TanStack Query's cache. Zustand never stores server payloads.

## Alternatives Considered

### Alternative 1: Keep server state in Zustand, sync manually from TanStack Query
- **Pros**: Single global store; components read one place
- **Cons**: Manual sync between TanStack Query cache and Zustand on every mutation; stale data bugs; cache invalidation duplicated
- **Why not**: Doubles maintenance burden and reintroduces the exact race conditions TanStack Query was chosen to eliminate

### Alternative 2: Use Zustand for everything, drop TanStack Query
- **Pros**: One state management library
- **Cons**: Loses TanStack Query's background refetch, stale-while-revalidate, polling, deduplication, and devtools; would require reimplementing caching primitives manually
- **Why not**: TanStack Query is already installed and provides production-grade caching; replacing it adds significant complexity for no gain

### Alternative 3: Use React Context for auth, remove Zustand entirely
- **Pros**: No extra library for auth state
- **Cons**: `tokenRefresh.ts` calls `useAuthStore.getState()` outside React components — Context API cannot be accessed outside the component tree
- **Why not**: The fetch interceptor pattern requires synchronous access to tokens outside React; Zustand's `getState()` enables this pattern cleanly

## Consequences

### Positive
- Single source of truth for server data (TanStack Query cache)
- Cache invalidation is handled by `invalidateQueries` — no manual Zustand sync
- `tokenRefresh.ts` can call `useAuthStore.getState()` outside React components
- Clear mental model: "Is this data from the server? → TanStack Query. Is this auth or transient UI? → Zustand."

### Negative
- Two state libraries to understand and maintain
- Developers must remember not to cache server responses in Zustand

### Risks
- Future contributors may instinctively reach for Zustand for server state; mitigated by removing `scheduleStore` mock seed data and documenting this ADR
