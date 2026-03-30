# ADR-0013: Auth-Time userRole Defaults to Member as Minimal-Privilege Fallback

**Date**: 2026-03-28
**Status**: accepted
**Deciders**: Allen

## Context

`authStore` exposes `userRole: 'Manager' | 'Member' | null`, but in Lymoon's data model a user's role is per-schedule — the same user can be a Manager in one schedule and a Member in another. The auth endpoints (`POST /auth/login`, `POST /auth/register`) return a global identity response with no role field, because there is no global role concept. Several UI components read `authStore.userRole` before any schedule has been loaded (e.g., avatar rendering, home screen layout), requiring a non-null value at auth time.

## Decision

`useLoginMutation` and `useRegisterMutation` write `userRole: 'Member'` to `authStore` as a minimal-privilege default immediately after authentication. The authoritative role for any schedule-scoped action or UI gate is always `ScheduleDetail.currentUserRole`, returned by `GET /api/schedules/:id` and held in TanStack Query cache. `authStore.userRole` is a safe display fallback — never the source of truth for authorization decisions.

```typescript
// In useLoginMutation / useRegisterMutation onSuccess:
setUser({
  userId: data.user.id,
  userName: data.user.displayName,
  userRole: 'Member', // minimal-privilege fallback; real role is per-schedule
  avatarInitials: computeInitials(data.user.displayName),
  accessToken: data.accessToken,
  refreshToken: data.refreshToken,
});
```

## Alternatives Considered

### Alternative 1: Leave userRole null at auth time
- **Pros**: Explicitly signals "no schedule loaded yet"; honest about the unknown
- **Cons**: TypeScript nullability propagates to every consumer; every component reading `authStore.userRole` must null-check before rendering; conditional rendering becomes cluttered
- **Why not**: Null semantics add noise at every callsite without adding safety — `Member` is already the correct minimal-privilege state

### Alternative 2: Fetch a global role from the server at login
- **Pros**: Accurate from the first render
- **Cons**: No global role concept exists in Lymoon's schema; would require a schema change and an additional API endpoint; misrepresents the data model
- **Why not**: Architectural mismatch — the domain does not have global roles

### Alternative 3: Default to Manager
- **Pros**: Avoids a brief flash of lower-privilege UI if the user is actually a Manager
- **Cons**: Grants higher privileges before the correct role is confirmed; any role-gated UI would render incorrectly for the window before a schedule loads
- **Why not**: Violates the principle of minimal privilege; incorrect for Member users

## Consequences

### Positive
- `authStore.userRole` is always non-null after login/register; TypeScript nullability is contained to the unauthenticated state
- Safe by default — any schedule-scoped role check that reads from TanStack Query cache gets the correct value; the `Member` fallback is never used for authorization decisions
- Consistent with Lymoon's security model: role escalation requires an explicit server call, not a client-side flag

### Negative
- A developer unfamiliar with this decision might read `authStore.userRole` to gate Manager UI and see apparently correct behavior in testing (if they're always a Manager in their test schedule), masking the bug

### Risks
- `authStore.userRole` being `'Member'` could cause a brief flash of Member-level UI between login and the first `useScheduleDetail` response. Mitigation: schedule detail loads immediately on navigation to a schedule screen, so the window is the network latency of one API call — acceptable at MVP
