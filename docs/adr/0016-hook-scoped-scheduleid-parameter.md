# ADR-0016: `scheduleId` passed as hook argument (closure), not mutation variable

**Date**: 2026-03-29
**Status**: accepted
**Deciders**: Allen

## Context

Several mutation hooks operate on a specific schedule: `useAddNextWeek`, `useRenameSchedule`, `useLeaveSchedule`, `useRemoveMember`. There are two natural signatures for such hooks. The `scheduleId` can be provided when the hook is called (at the component level) and closed over in the `mutationFn`, or it can be passed as part of the mutation's variable object at the call-site of `mutate()`. The choice affects how the component wires the hook and how cache invalidation is expressed.

## Decision

`scheduleId` is a parameter of the hook function itself, not a mutation variable. Example:

```typescript
// Hook declaration
export function useRenameSchedule(scheduleId: string) { ... }

// Component usage
const rename = useRenameSchedule(schedule.id);
rename.mutate('New Name');   // only the variable payload
```

The `scheduleId` is closed over in both `mutationFn` and `onSuccess`, so the invalidation target is determined at hook instantiation time.

## Alternatives Considered

### Alternative 1: Pass `scheduleId` as part of the mutation variables object
```typescript
export function useRenameSchedule() { ... }
rename.mutate({ scheduleId: schedule.id, title: 'New Name' });
```
- **Pros**: A single hook instance is reusable across different schedules; hook can be called once at a higher level
- **Cons**: Cache invalidation in `onSuccess` must destructure `variables` to know which key to invalidate — this works but is less readable. The hook is less self-contained.
- **Why not**: Components always hold a single `scheduleId` in their context (from route params); a generalized hook provides no practical benefit

### Alternative 2: Factory function returning a pre-bound hook
- **Pros**: Explicit about the binding
- **Cons**: Unnecessary indirection; not idiomatic TanStack Query
- **Why not**: Over-engineered for this use case

## Consequences

### Positive
- `onSuccess` invalidation is clean and readable — `scheduleKeys.detail(scheduleId)` requires no destructuring
- Hook API surface matches component mental model: "I am managing this specific schedule"
- Each hook instance is fully self-contained

### Negative
- A component that needs to mutate multiple different schedules must call multiple hook instances — acceptable given that this scenario does not occur in this app

### Risks
- None identified for the current single-schedule-per-screen navigation model
