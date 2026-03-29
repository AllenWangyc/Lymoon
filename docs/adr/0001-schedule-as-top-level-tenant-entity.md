# ADR-0001: Schedule as Top-Level Multi-Tenant Entity (No Teams Table)

**Date**: 2026-03-25
**Status**: accepted
**Deciders**: Allen

## Context

The original CLAUDE.md schema included a `teams` table as the top-level multi-tenant entity, with `team_members` linking users to teams. However, the frontend product design treats a *Schedule* as the primary object a user creates, joins, and operates within — not a generic "team". Users create schedules directly, invite others to them with a code, and all shifts belong to a schedule. There is no UX concept of a team that contains multiple schedules.

## Decision

We use `Schedule` as the top-level multi-tenant entity. Each schedule has its own `schedule_members` table (replacing `team_members`), its own invite code, its own roles (Manager / Member), and owns all shifts directly. There is no separate `teams` table.

## Alternatives Considered

### Alternative 1: Keep a Teams table, schedules belong to teams
- **Pros**: Familiar SaaS pattern; one team can own multiple schedules; easier to add cross-schedule features later
- **Cons**: Adds an extra join layer; the frontend has no concept of "team" in its UX; over-engineering for MVP
- **Why not**: The product is schedule-centric. A "team" in this context *is* a schedule. Adding a teams layer would require the frontend to manage team creation before schedule creation, which contradicts the designed flow.

### Alternative 2: Schedule embeds member list directly (no join table)
- **Pros**: Simpler schema
- **Cons**: Cannot store per-member metadata (role, join date); makes queries harder
- **Why not**: Role (Manager / Member) is required for authorization checks on every service call.

## Consequences

### Positive
- Simpler schema — fewer tables and joins for all queries
- Authorization checks are straightforward: load `schedule_members` row for the requesting user
- Invite codes are scoped to a schedule, which is exactly what the UX shows
- MVP ships faster without the team abstraction layer

### Negative
- If the product later needs cross-schedule aggregations (e.g., "all shifts across all schedules for this business"), there is no team entity to group by — would require a new table at that point
- A user cannot belong to an "organization" that spans multiple schedules; each schedule is fully independent

### Risks
- If multi-schedule grouping is needed pre-MVP, a Teams table will need to be retrofitted. Consult Allen before building any feature that implies a team-level grouping.
