# ADR-0004: `ShiftType` Stored as a Database Column, Not Derived

**Date**: 2026-03-26
**Status**: accepted
**Deciders**: Allen

## Context

The API contract (`docs/API.md`) requires a `shiftType` field on every shift object (`"Morning" | "Standard" | "Afternoon" | "Custom"`). The original Step 1 `Shift` model did not include this column — it was first noticed when implementing Step 3's `GET /api/schedules/{id}` response, which must return shifts with `shiftType`. Two options were available: derive the type from `startTime` / `endTime` ranges, or store it explicitly as a column.

## Decision

We store `ShiftType` as a `text` column on the `shifts` table (default `"Custom"`). The client supplies the value when creating a shift; the backend persists it. No derivation logic exists.

## Alternatives Considered

### Alternative 1: Derive ShiftType from time ranges (e.g., Morning = 06:00–12:00)
- **Pros**: No extra column; type is always consistent with the actual times
- **Cons**: Time boundaries are arbitrary and culturally variable; a 07:30–15:30 shift has no obvious single label; the client already knows what label it wants to show
- **Why not**: The label is a display/UI concept chosen by the manager, not a rule derivable from times. Deriving it would produce wrong labels for non-standard shifts.

### Alternative 2: Store as an enum in the database
- **Pros**: Database-level constraint; prevents invalid values
- **Cons**: Adding a new shift type requires a migration; PostgreSQL enums are harder to alter than text columns
- **Why not**: `[Required]` + application-level validation is sufficient for MVP. A text column with a check constraint can be added later if strict DB enforcement is needed.

## Consequences

### Positive
- Simple implementation: client sends the label, backend stores it, backend returns it
- No derivation edge cases or boundary disputes
- Supports future shift types without a schema migration (just update the allowed values in the DTO validator)

### Negative
- The database accepts any string — invalid values like `"Brunch"` will not be rejected at the DB level
- Retroactively backfilling `ShiftType` for shifts created before this column existed required a migration with `DEFAULT ''` (empty string), which is technically invalid. Future code must handle empty `ShiftType` gracefully or add a data migration to set `"Custom"` for older rows.

### Risks
- The `AddShiftType` migration applied `DEFAULT ''` (EF Core default for required text). Any existing shifts in dev/staging will have an empty `ShiftType`. Run a one-time `UPDATE shifts SET "ShiftType" = 'Custom' WHERE "ShiftType" = ''` if real shift data exists. This is safe for MVP since no shifts have been created yet.
