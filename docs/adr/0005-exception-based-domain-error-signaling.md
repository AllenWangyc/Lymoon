# ADR-0005: Exception-Based Domain Error Signaling in Service Layer

**Date**: 2026-03-26
**Status**: accepted
**Deciders**: Allen

## Context

Step 4 introduced service methods (`LookupByCodeAsync`, `JoinByCodeAsync`, `LeaveScheduleAsync`, `RemoveMemberAsync`, `AddNextWeekAsync`) that each need to communicate multiple distinct error conditions to the controller — not found, conflict (sole manager, already member), and forbidden (non-manager action). A consistent pattern was needed that would apply across all future service implementations without leaking HTTP concepts into the service layer.

## Decision

Services throw standard .NET exceptions to signal domain errors. Controllers use a shared `HandleDomainException` switch expression to map them to HTTP responses:

| Exception | HTTP Status | Example message key |
|-----------|-------------|---------------------|
| `KeyNotFoundException` | 404 Not Found | `"invalid_code"`, `"not_a_member"` |
| `InvalidOperationException` | 409 Conflict | `"already_member"`, `"sole_manager"` |
| `UnauthorizedAccessException` | 403 Forbidden | `"Only a Manager can..."` |

The message string on the exception is forwarded directly as `{ "error": "<message>" }` in the response body.

## Alternatives Considered

### Alternative 1: Result/Either type (`ServiceResult<T>`)

- **Pros**: Fully type-safe; error cases are visible in the method signature; no try/catch in controllers
- **Cons**: Requires a new wrapper type on every service method return; callers must always pattern-match the result; adds ceremony for an MVP with few callers
- **Why not**: Over-engineered for the current scale. Can be introduced later if the service layer grows or gets unit-tested extensively.

### Alternative 2: Nullable returns with an out-error parameter

- **Pros**: No custom types needed
- **Cons**: Cannot cleanly distinguish 404 from 403 from 409 through a single nullable; awkward in async methods
- **Why not**: Produces ambiguous method contracts and requires convention-based interpretation at call sites.

### Alternative 3: Custom `HttpException` hierarchy (e.g. `NotFoundException`, `ConflictException`)

- **Pros**: Strongly-typed, one exception per status code
- **Cons**: Introduces a project-specific exception hierarchy; couples service semantics to HTTP concepts, making services harder to reuse outside an HTTP context
- **Why not**: Services should not know about HTTP. Standard .NET exceptions keep the service layer transport-agnostic.

## Consequences

### Positive

- Idiomatic C# — no new types to learn or maintain
- Controllers stay thin; all exception-to-status mapping lives in one `HandleDomainException` helper
- Service method signatures are clean (no wrapper types, no out parameters)

### Negative

- `InvalidOperationException` is reused for all 409 scenarios — the message string acts as an informal sub-code (`"already_member"`, `"sole_manager"`). This is a convention, not enforced by the type system.
- Exception handling has a small runtime cost compared to result types; negligible at MVP scale.

### Risks

- If a new error scenario does not map cleanly to the three existing exception types, a developer may abuse an existing one (e.g. throwing `KeyNotFoundException` for a 403). Mitigate by: (a) keeping the `HandleDomainException` helper easy to extend, and (b) adding a comment in the helper listing valid use cases for each exception type.
