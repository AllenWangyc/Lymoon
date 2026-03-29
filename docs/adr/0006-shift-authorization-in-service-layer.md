# ADR-0006: Three-tier Shift Authorization Enforced in Service Layer

**Date**: 2026-03-26
**Status**: accepted
**Deciders**: Allen

## Context

Shift operations (add, update, delete) have a three-tier authorization matrix:
1. **Manager** — can operate on any shift in the schedule
2. **Member under `full_collaboration`** — can operate on any shift
3. **Member under `manager_only`** — can only add shifts for themselves and edit/delete their own shifts

Enforcing this correctly requires knowing: (a) the requester's role in `schedule_members`, and (b) the schedule's `MemberPermission` setting. Both are database values that must be fetched at runtime. The question was where to place this enforcement.

## Decision

Authorization is enforced inside `ShiftService` methods. The service loads `ScheduleMember` and `Schedule` records, evaluates the three-tier matrix, and throws `UnauthorizedAccessException` if the requester lacks permission. Controllers catch this exception and return `403`.

## Alternatives Considered

### Alternative 1: ASP.NET Core Authorization Policies
- **Pros**: Idiomatic ASP.NET approach; declarative via attributes; testable in isolation
- **Cons**: Resource-based policies require `IAuthorizationService` + `AuthorizationHandler` per resource type; the logic still needs a DB query to load the membership and permission — it just moves the plumbing without simplifying it
- **Why not**: Adds ~3 extra files (policy, handler, requirement) for no gain in this MVP; the authorization logic is tightly coupled to business data that the service is already fetching

### Alternative 2: Authorization Logic Inline in Controller
- **Pros**: Easy to read end-to-end in a single file
- **Cons**: Violates thin-controller principle; duplicates DB access already done in the service; harder to unit-test business rules in isolation
- **Why not**: Inconsistent with the project's controllers-are-thin convention

## Consequences

### Positive
- Authorization logic lives next to the business logic that requires it — cohesive and easy to reason about
- Service methods are self-contained and safe to call from any future consumer (background jobs, other services) without risk of bypassing authorization
- No ASP.NET Core policy infrastructure to maintain

### Negative
- Authorization errors surface as exceptions rather than early HTTP short-circuits — controllers must catch `UnauthorizedAccessException` and map to 403

### Risks
- If a developer calls a service method without catching `UnauthorizedAccessException`, the exception will propagate as a 500. Mitigation: global exception middleware (planned in Step 6) provides a safety net.
