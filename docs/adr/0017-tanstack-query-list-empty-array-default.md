# ADR-0017: Empty-array default for TanStack Query list data

**Date**: 2026-03-29
**Status**: accepted
**Deciders**: Allen

## Context

When replacing Zustand mock schedule arrays with live TanStack Query fetches, screen components call `.filter()` and `.map()` on the query result before the first response arrives. Without a default, `data` is `undefined` on the initial render, causing runtime errors in filter/map chains and requiring explicit null-guards everywhere the list is consumed.

## Decision

All TanStack Query hooks that return lists use an empty-array fallback at the call site:

```typescript
const { data: schedules = [], isLoading: schedulesLoading } = useSchedules();
```

The hook itself returns the raw API shape; the default is applied only where the data is destructured in the component.

## Alternatives Considered

### Alternative 1: Null-guard in every consumer
- **Pros**: Explicit, no hidden fallback
- **Cons**: Boilerplate in every component; easy to forget; spreads defensive logic across many files
- **Why not**: Violates DRY and places burden on each call site

### Alternative 2: Return `[]` as hook default inside the query hook
- **Pros**: Centralizes the default
- **Cons**: Hides the fact that data is initially `undefined`; makes it harder to distinguish "loading" from "empty" if `isLoading` is not checked separately
- **Why not**: Call-site destructuring default keeps the hook's return type honest while still being concise

### Alternative 3: Treat loading and undefined as the same — show spinner only
- **Pros**: No default needed; skip render until data arrives
- **Cons**: Requires wrapping the entire list section in `if (!data)` early returns, bloating screen files
- **Why not**: The three-branch ternary (`loading → empty → list`) is more expressive and fits the existing component structure

## Consequences

### Positive
- Zero null-checks in filter/map chains; TypeScript infers `ScheduleItem[]` not `ScheduleItem[] | undefined`
- Consistent pattern: every list screen uses `data: items = []` — no per-screen variation
- `isLoading` still available alongside the default to render a spinner separately

### Negative
- The default silences the `undefined` state; developers must remember to check `isLoading` explicitly if they need to distinguish "not yet fetched" from "fetched and empty"

### Risks
- If a future hook returns `null` (not `undefined`) on error, the default won't activate — mitigated by ensuring all query hooks follow the `undefined`-on-pending convention from TanStack Query v5
