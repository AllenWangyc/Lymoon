# ADR-0002: Compute `hours` and `days` Opacity Server-Side on Every Request

**Date**: 2026-03-26
**Status**: accepted
**Deciders**: Allen

## Context

The schedule list and detail responses include two computed fields per schedule:
- `hours`: total shift hours for the requesting user in `currentWeek`, formatted as a string (e.g. `"38.5"`)
- `days`: a 7-element array where each element carries an `opacity` value computed as `min(1.0, 0.35 + dailyHours / 8.0 * 0.65)` and an `isToday` flag

These fields are UI-specific aggregations. There are three places they could live: the database (stored/materialized), the backend service (computed at request time), or the mobile client (computed after a raw shifts fetch).

## Decision

We compute `hours` and `days` in `ScheduleService` on every `GET /api/schedules` and `GET /api/schedules/{id}` request. The computation reads the in-memory `Shift` collection already loaded with the schedule, so there is no extra database query.

## Alternatives Considered

### Alternative 1: Store computed values in the database (materialized columns)
- **Pros**: Zero computation at read time; useful if the list is queried very frequently
- **Cons**: Requires updating stored values on every shift mutation; adds write complexity and risk of stale data
- **Why not**: MVP scale does not justify the complexity. A user will have at most ~20 shifts per week; the computation is O(n) and trivial.

### Alternative 2: Compute on the mobile client after a raw shifts fetch
- **Pros**: Backend stays thin; client has full flexibility over display logic
- **Cons**: Requires an extra API call (shifts endpoint) before the list can render; duplicates business logic in the client; harder to keep in sync if the formula changes
- **Why not**: The schedule list is the home screen — it must load in one request. Sending raw shifts would bloat the payload and add a round trip.

## Consequences

### Positive
- Single API call returns everything the home screen needs
- Formula changes (e.g., adjusting the opacity curve) require only a backend deploy, not a mobile release
- No cache invalidation or stale-data risk

### Negative
- Every `GET /api/schedules` re-computes for every schedule the user belongs to, even if shifts haven't changed
- `isToday` is computed using `DateTime.UtcNow` — the result is request-time sensitive (correct behavior, but worth noting in tests)

### Risks
- If a user belongs to many schedules (e.g., 50+), the in-memory computation across all shifts could become noticeable. Add a limit or pagination to `GET /api/schedules` before that becomes a problem, rather than optimizing prematurely.
