# ADR-0023: WeekBar Day Opacity Driven by Shift Presence and Duration

**Date**: 2026-03-30
**Status**: accepted
**Deciders**: Allen

## Context

The `ScheduleCard` on the home screen shows a `WeekBar` with 7 day columns that visually indicate
shift load for the current week. The backend `ComputeDays` method previously computed opacity as
`0.35 + dailyHours / 8.0 * 0.65`, which yields `0.35` even for days with zero shifts. The
`WeekBar` frontend only renders a day as gray when `opacity === 0`. This caused all 7 bars to always
appear green regardless of actual shift coverage, making the visualization misleading.

## Decision

Fix the backend `ComputeDays` formula in `ScheduleService.cs` to return `opacity = 0` for days
with no shifts, and `0.3 + dailyHours / 8.0 * 0.7` (capped at 1.0) for days with shifts.
No frontend changes are required.

## Alternatives Considered

### Alternative 1: Fix the frontend threshold
Change `WeekBar.tsx` gray condition from `opacity === 0` to `opacity < 0.35`.
- **Pros**: No backend change needed
- **Cons**: Introduces a magic number on the frontend that is implicitly coupled to the backend formula; breaks if the backend formula changes
- **Why not**: Creates invisible coupling between layers

### Alternative 2: Add a `hasShifts` boolean to `DayDto`
Add an explicit `HasShifts` field alongside `Opacity`.
- **Pros**: Self-documenting intent; decouples presence signal from intensity value
- **Cons**: Redundant — `opacity == 0` already encodes absence; adds schema surface area
- **Why not**: Over-engineered for this use case

### Alternative 3: Fix the backend formula (chosen)
Make `opacity = 0` the canonical signal for "no shifts on this day".
- **Pros**: Single source of truth; frontend contract stays clean; no new fields
- **Cons**: `opacity = 0` becomes a semantic sentinel — must be preserved as a convention

## Consequences

### Positive
- WeekBar accurately reflects actual shift data: gray = no shift, green intensity ∝ shift duration
- No frontend changes required; `WeekBar.tsx` already handles `opacity === 0` → gray
- Backend remains the single source of truth for day-level shift intensity

### Negative
- `opacity = 0` is now a semantic sentinel value, not merely "fully transparent"

### Risks
- Future changes to `DayDto` or `WeekBar` must preserve the `opacity === 0` → no-shift contract;
  this convention should be documented in code comments if the formula is ever revisited
