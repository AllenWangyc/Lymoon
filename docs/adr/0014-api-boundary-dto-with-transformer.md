# ADR-0014: Local API boundary DTO with explicit transformer in query hooks

**Date**: 2026-03-29
**Status**: accepted
**Deciders**: Allen

## Context

The mobile app shares TypeScript types (`ScheduleItem`, `ScheduleDetail`) between UI components and data-fetching hooks. The API response shape does not always match these UI types exactly — notably, `subtitle` is computed client-side (see ADR-0009), and `description` arrives as `string | null` from JSON but is typed as `string | undefined` in the UI layer. Without a boundary layer, the query function would need to cast or the shared types would need to accommodate the API's nullable/absent fields, polluting the UI model with backend concerns.

## Decision

Each query file declares a local `ApiXxx` interface that mirrors the exact JSON shape returned by the backend. A `toXxx()` transformer function converts from `ApiXxx` to the UI type. Components and UI code only ever see the UI types; no raw API shapes leak past the query hook boundary.

## Alternatives Considered

### Alternative 1: Reuse UI types directly as API response types
- **Pros**: Less code; no duplication of type fields
- **Cons**: Forces UI types to match backend shape exactly — including nullability, casing, and computed-field presence. Any backend change breaks UI types directly.
- **Why not**: Couples UI model to backend contract; makes it impossible to compute client-side fields cleanly

### Alternative 2: Shared DTO types in `src/types/` used by both API and UI layers
- **Pros**: Single source of truth; no local interface per query file
- **Cons**: The shared type must be the union of what the backend sends and what the UI expects. Backend nullable fields (`description: string | null`) vs UI optional fields (`description?: string`) create constant friction.
- **Why not**: Contaminates the UI type with API-specific nullability semantics

## Consequences

### Positive
- UI components are fully insulated from backend shape changes
- Transformer functions are the single place to handle null-to-undefined coercion, computed fields, and any data normalization
- Extending or versioning the API only requires updating `ApiXxx` + the transformer

### Negative
- Mild field duplication between `ApiScheduleItem` and `ScheduleItem`
- Every new endpoint requires defining both an `ApiXxx` interface and a transformer

### Risks
- If the transformer is skipped (e.g. a developer calls `apiGet<ScheduleItem>()` directly), nullability guarantees are lost — code review discipline is the mitigation
