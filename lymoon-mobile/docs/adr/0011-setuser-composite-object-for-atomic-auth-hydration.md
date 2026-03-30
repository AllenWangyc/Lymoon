# ADR-0011: `setUser` Accepts a Single Composite Object for Atomic Auth Hydration

**Date**: 2026-03-28
**Status**: accepted
**Deciders**: Allen

## Context

When a login or register response arrives, the client must write six fields to `authStore`: `userId`, `userName`, `userRole`, `avatarInitials`, `accessToken`, and `refreshToken`, plus set `isAuthenticated: true`.

The original `setUser` signature took four positional parameters (`userId, userName, userRole, avatarInitials`) and left tokens to a separate `setTokens` call. This created a window where the store held a partial state — user identity set but no token — which could cause any component reading `isAuthenticated` to see `false` transiently, or cause an authenticated fetch to fire with a null token.

## Decision

`setUser` accepts a single composite object containing all six fields. One Zustand `set()` call writes all state atomically. `isAuthenticated` flips to `true` in the same transaction.

```typescript
setUser: (data: {
  userId: string;
  userName: string;
  userRole: UserRole;
  avatarInitials: string;
  accessToken: string;
  refreshToken: string;
}) => void;
```

`setTokens(accessToken, refreshToken)` is retained exclusively for the token-refresh path, where user identity fields are already populated and only tokens need rotation.

## Alternatives Considered

### Alternative 1: Keep positional parameters, add token params
- **Pros**: Backwards compatible with original callers
- **Cons**: Six positional arguments are error-prone — easy to swap `accessToken` and `refreshToken`; partial state window remains if called before `setTokens`
- **Why not**: No existing callers at the time of this change; backwards compatibility has no value here

### Alternative 2: Two separate calls — `setUser(identity)` then `setTokens(tokens)`
- **Pros**: Separation of concerns between identity and credentials
- **Cons**: Requires callers to always call both in sequence; partial-state window between calls; `isAuthenticated` cannot safely be set in either call alone
- **Why not**: The login/register response returns both at once; splitting the write is artificial and introduces a race condition

## Consequences

### Positive
- Auth hydration is atomic — no partial-state window
- `isAuthenticated` is always accurate; no transient false negatives
- Single call site per login/register flow
- Named properties prevent argument-order bugs

### Negative
- Callers must construct the full object; slightly more verbose than positional args

### Risks
- None identified; all call sites are new (no existing callers to migrate)
