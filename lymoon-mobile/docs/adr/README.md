# Architecture Decision Records

This directory captures key architectural decisions made during the development of Lymoon.
Each ADR documents the context, decision, alternatives considered, and consequences.

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-schedule-as-top-level-tenant-entity.md) | Schedule as top-level multi-tenant entity (no Teams table) | accepted | 2026-03-25 |
| [0002](0002-server-side-computed-schedule-fields.md) | Compute hours and days opacity server-side on every request | accepted | 2026-03-26 |
| [0003](0003-client-supplied-iconbg.md) | Client supplies iconBg; backend persists as-is | accepted | 2026-03-26 |
| [0004](0004-shifttype-as-stored-column.md) | ShiftType stored as a database column, not derived | accepted | 2026-03-26 |
| [0005](0005-exception-based-domain-error-signaling.md) | Exception-based domain error signaling in service layer | accepted | 2026-03-26 |
| [0006](0006-shift-authorization-in-service-layer.md) | Three-tier shift authorization enforced in service layer (not ASP.NET Core policies) | accepted | 2026-03-26 |
| [0007](0007-shift-weekstart-from-schedule-currentweek.md) | Shift WeekStart assigned server-side from schedule.CurrentWeek | accepted | 2026-03-26 |
| [0008](0008-minimal-two-file-api-layer-over-interceptor-pipeline.md) | Minimal two-file API layer over interceptor pipeline | accepted | 2026-03-28 |
| [0009](0009-subtitle-client-computed-display-field.md) | subtitle is a client-computed display field, not an API response field | accepted | 2026-03-28 |
| [0010](0010-zustand-scoped-to-auth-and-ui-state.md) | Zustand scoped to auth tokens and ephemeral UI state only | accepted | 2026-03-28 |
| [0011](0011-setuser-composite-object-for-atomic-auth-hydration.md) | `setUser` accepts a single composite object for atomic auth hydration | accepted | 2026-03-28 |
| [0012](0012-client-side-required-field-validation-before-mutation.md) | Client-side required-field validation before API mutations | accepted | 2026-03-28 |
| [0013](0013-auth-time-userrole-defaults-to-member.md) | Auth-time userRole defaults to Member as minimal-privilege fallback | accepted | 2026-03-28 |
| [0014](0014-api-boundary-dto-with-transformer.md) | Local API boundary DTO with explicit transformer in query hooks | accepted | 2026-03-29 |
| [0015](0015-schedulelookup-as-mutation.md) | `useScheduleLookup` implemented as `useMutation`, not `useQuery` | accepted | 2026-03-29 |
| [0016](0016-hook-scoped-scheduleid-parameter.md) | `scheduleId` passed as hook argument (closure), not mutation variable | accepted | 2026-03-29 |
| [0017](0017-tanstack-query-list-empty-array-default.md) | Empty-array default for TanStack Query list data at call site | accepted | 2026-03-29 |
| [0018](0018-post-mutation-navigation-via-url-params.md) | Post-mutation navigation passes result data as URL query params | accepted | 2026-03-29 |
| [0019](0019-auth-gated-enabled-flag-on-polling-queries.md) | Auth-gated `enabled` flag on polling queries | accepted | 2026-03-30 |
| [0020](0020-notification-type-exported-from-query-hook.md) | API response types exported from query hook file when no transformation is needed | accepted | 2026-03-30 |
| [0021](0021-notifications-accessed-via-home-header-bell-not-tab.md) | Notifications accessed via home screen header bell icon, not a dedicated tab | accepted | 2026-03-30 |
| [0022](0022-optimistic-mutation-uses-onsettled-not-onsuccess.md) | Optimistic-update mutations use `onSettled` for server re-sync, not `onSuccess` | accepted | 2026-03-30 |
| [0023](0023-weekbar-opacity-driven-by-shift-presence-and-duration.md) | WeekBar Day Opacity Driven by Shift Presence and Duration | accepted | 2026-03-30 |
