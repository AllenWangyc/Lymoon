# ADR-0020: API response types exported from their query hook file when no transformation is needed

**Date**: 2026-03-30
**Status**: accepted
**Deciders**: Allen

## Context

ADR-0014 establishes that query hooks define local API boundary DTOs and transform them into domain types before returning data to callers. However, for `Notification`, the API response shape is also the domain type — there is no client-side transformation (no computed fields, no field renames). When a screen imports both the hook and the type, it is forced to either re-define the interface locally (causing duplication) or import it from a third location.

The notifications screen (`notifications/index.tsx`) re-defined `interface Notification` identically to the one in `notifications.ts`. This duplication was caught in code review.

## Decision

When an API response type requires no client-side transformation, it is defined once in the query hook file and exported with `export interface`. The primary consumer screen imports the type directly from the query file alongside the hook itself:

```typescript
// notifications.ts
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// index.tsx
import { useNotifications, useMarkNotificationsRead, type Notification } from '@/lib/queries/notifications';
```

Types that ARE transformed (e.g., `ScheduleItem`, `Shift`) continue to live in `src/types/schedule.ts` as domain types.

## Alternatives Considered

### Alternative 1: Always put types in `src/types/`
- **Pros**: Single canonical location for all types; consistent regardless of whether transformation exists
- **Cons**: Creates a second file to update whenever an API endpoint changes; the query hook and the type file become a coupled pair without being co-located; for simple pass-through types, this feels like bureaucratic overhead
- **Why not**: For types that are purely API shapes with no domain significance, `src/types/` adds indirection without benefit.

### Alternative 2: Duplicate locally in each consumer
- **Pros**: No cross-file coupling; each file is fully self-contained
- **Cons**: Drift risk — two definitions of the same shape can diverge silently; TypeScript structural typing means a mismatch won't always produce an error
- **Why not**: Duplication was the original bug caught in review; it is not a valid pattern going forward.

## Consequences

### Positive
- Single definition for each API shape; no duplication across hook and screen
- Co-location: the type lives next to the function that fetches and returns it
- Easy to update: changing the API response requires editing only one file

### Negative
- Two different canonical locations for types (`src/types/` for domain types, query hook files for raw API shapes) — requires judgment about which category a type falls into
- Consumers must import from `lib/queries/` rather than `src/types/`, which is less intuitive for developers expecting all types in one place

### Risks
- If a "pass-through" type later gains a computed field and needs transformation, the type must be migrated to `src/types/` and all imports updated. The migration is mechanical but must not be forgotten.
