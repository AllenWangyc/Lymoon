# ADR-0009: subtitle Is a Client-Computed Display Field, Not an API Response Field

**Date**: 2026-03-28
**Status**: accepted
**Deciders**: Allen

## Context

`ScheduleItem` (the list-level schedule representation on the mobile client) contains a `subtitle`
string that is shown beneath each schedule card. Both `docs/API.md` and `docs/frontend-summary.md`
were consulted when designing the TypeScript types for the frontend API integration. The documents
disagreed on whether this field should come from the server or be assembled client-side.

`API.md` does not include `subtitle` in any response shape.
`frontend-summary.md` specifies that it should be computed locally as:
`"${scheduleType} • ${format(currentWeek, 'MMM d')}"`.

The raw inputs (`scheduleType` and `currentWeek`) are both returned by the API, so the client has
everything it needs to compute the string.

## Decision

`ScheduleItem.subtitle` is computed on the mobile client, not returned by the API. The field is
retained in the TypeScript type (annotated `// locally computed — NOT from API`) to make the
display contract explicit to future developers. The API returns `scheduleType` and `currentWeek`
as raw data; the client formats them into a display string.

## Alternatives Considered

### Alternative 1: Server returns subtitle directly
- **Pros**: Client has less formatting logic; consistent display across platforms
- **Cons**: Server returns a UI display string — a presentation concern that belongs in the client; harder to change formatting without a backend deploy; adds coupling between API contract and UI copy
- **Why not**: Violates separation of concerns. Subtitle is purely presentational and its inputs are already in the response.

### Alternative 2: Omit subtitle from the type entirely, compute inline
- **Pros**: Avoids a "phantom" field in the type
- **Cons**: Every consumer must know how to format it; duplicated logic across screens
- **Why not**: Keeping it as a named field (even if client-computed) makes the contract explicit and allows a single computation site.

## Consequences

### Positive
- API contract stays free of UI/display strings
- Subtitle formatting can be changed in one place on the client without a backend change
- Explicit annotation in the type file prevents future developers from assuming the field comes from the API

### Negative
- The type contains a field that is never populated by raw API deserialization — a slightly unusual pattern
- Developers mapping API responses must remember to compute this field manually

### Risks
- If `currentWeek` or `scheduleType` is absent from an API response, the computed subtitle will be incomplete. Mitigated by both fields being required in the schedule list endpoint contract.
