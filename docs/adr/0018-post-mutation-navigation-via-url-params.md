# ADR-0018: Post-mutation navigation passes result data as URL query params

**Date**: 2026-03-29
**Status**: accepted
**Deciders**: Allen

## Context

After `useCreateSchedule` succeeds, the app navigates from `create-schedule` to `schedule-created`. The target screen needs three fields from the API response: `id`, `inviteCode`, and `title`. A mechanism was needed to transfer this one-shot result between screens.

## Decision

Pass the creation result as URL query params via `router.replace(...)`. The `schedule-created` screen reads them with `useLocalSearchParams`. No intermediate Zustand state is used.

## Alternatives Considered

### Alternative 1: Store in Zustand `scheduleStore`
- **Pros**: Readable from anywhere, survives navigation events
- **Cons**: Requires manual cleanup; pollutes the store with ephemeral one-shot data; violates the rule that Zustand holds only auth tokens and UI state
- **Why not**: ADR-0010 already scopes Zustand to auth + UI-only state; creation result is transient server data

### Alternative 2: React Context or ref
- **Pros**: No store pollution
- **Cons**: Adds a provider just for one-shot data; overkill for two-screen handoff
- **Why not**: URL params are already a first-class navigation primitive in Expo Router

## Consequences

### Positive
- Creation result is ephemeral and scoped to the navigation event — no cleanup needed
- Deep-linkable in principle (schedule-created could be navigated directly with params)
- Consistent with Expo Router's typed params convention

### Negative
- All three params must be URL-encoded; `title` requires `encodeURIComponent`
- If the navigation stack is unusually deep, params propagate through the URL only (not accessible to unrelated screens)

### Risks
- If `schedule-created` is ever reachable from another code path, the caller must supply the same three params — a guard (`if (!id || !inviteCode || !title) router.replace('/')`) should be added in Task 10
