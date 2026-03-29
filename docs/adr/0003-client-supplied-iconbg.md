# ADR-0003: Client Supplies `iconBg`; Backend Persists As-Is

**Date**: 2026-03-26
**Status**: accepted
**Deciders**: Allen

## Context

Each schedule displays a colored icon on the home screen (`iconBg`, e.g. `"rgba(182,236,19,0.1)"`). This color is chosen at schedule creation time. Two places could own this value: the backend could assign it from a fixed palette, or the client could choose it and send it with the create request.

## Decision

The mobile client picks `iconBg` (from its own palette or user selection) and sends it in `POST /api/schedules`. The backend stores it verbatim and returns it in all schedule responses. No server-side palette logic exists.

## Alternatives Considered

### Alternative 1: Backend assigns iconBg from a server-side palette
- **Pros**: Guaranteed valid values; client doesn't need to know about colors
- **Cons**: Backend now encodes UI/aesthetic concerns; changing the palette requires a backend deploy; the client cannot let users customize their color
- **Why not**: Color selection is a UI concern. The backend has no business logic around colors — it is purely a display preference owned by the creator.

### Alternative 2: iconBg derived from schedule type (e.g., "shift" → green)
- **Pros**: Consistent color coding across all users
- **Cons**: Removes personalization; still encodes UI concerns in the backend
- **Why not**: The product design allows the creator to pick a color, not the system.

## Consequences

### Positive
- Backend stays free of UI/presentation logic
- The client can evolve its color palette without any backend changes
- Creator personalization is supported from day one

### Negative
- The backend performs no validation on `iconBg` — any string is accepted. An invalid value (e.g., an empty string) would render incorrectly on other clients
- If the mobile app changes its color format (e.g., from `rgba(...)` to a hex string), old schedules retain the old format in the database

### Risks
- Add at minimum a `[Required]` validation on `iconBg` in `CreateScheduleRequest` to prevent empty values being stored. Consider a max-length constraint if injection risk is a concern.
