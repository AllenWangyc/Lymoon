# ADR-0007: Shift WeekStart Assigned Server-side from schedule.CurrentWeek

**Date**: 2026-03-26
**Status**: accepted
**Deciders**: Allen

## Context

When a member adds a shift, it must be associated with a specific week (`WeekStart`). The schedule model has two week fields: `StartWeek` (the first week) and `CurrentWeek` (the latest active week, advanced by the manager via "Add Next Week"). The question was whether the client should tell the backend which week a shift belongs to, or whether the backend should decide.

## Decision

The `WeekStart` for a new shift is always assigned server-side as `schedule.CurrentWeek` at the moment of creation. The client does not include a `weekStart` field in the `AddShiftRequest` body.

## Alternatives Considered

### Alternative 1: Client Supplies weekStart in the Request
- **Pros**: More explicit; client can pre-schedule shifts for a week before the manager clicks "Add Next Week"; no risk of race conditions where currentWeek changes between the client loading the screen and submitting the form
- **Cons**: Backend must validate that the supplied `weekStart` is between `StartWeek` and `CurrentWeek`; frontend must pass the week it is currently viewing; opens the door to off-schedule shifts being created for arbitrary past/future weeks if validation is incomplete
- **Why not**: Adds validation complexity and trust surface; the manager controls week progression deliberately, so shifts should always land in the latest active week

### Alternative 2: Always Use CurrentWeek but Expose It on the Response
- **Pros**: Client can confirm which week was used
- **Cons**: No different from the chosen approach — the client already knows `currentWeek` from the schedule detail it loaded
- **Why not**: Not a meaningful alternative; equivalent to the chosen approach

## Consequences

### Positive
- No client validation needed for `weekStart`; the field is computed, not supplied
- Enforces the invariant that only the manager can open new weeks; a member cannot create shifts "in the future" by supplying a future week
- Simpler DTO (`AddShiftRequest` has no `weekStart` field)

### Negative
- If a manager advances the week while a member has the schedule screen open, the member's next shift submission will land in the new week, not the week they are viewing — a potential UX surprise
- The frontend shift creation UI must be careful to indicate which week it is adding to (always `currentWeek`)

### Risks
- Stale-screen race condition: member sees week N, manager advances to week N+1, member submits a shift that lands in N+1. Mitigation: the `GET /api/schedules/{id}` response includes `currentWeek`; the mobile client should show a "week has advanced" notice if the response week differs from what is displayed. This is a UX concern, not a data integrity concern — shifts are always in a valid week.
