# ADR-0012: Client-Side Required-Field Validation Before API Mutations

**Date**: 2026-03-28
**Status**: accepted
**Deciders**: Allen

## Context

Form screens (login, register) can handle input validation in two ways: send all inputs to the server unconditionally and display whatever errors come back, or validate locally first and fast-fail before making a network call. On mobile networks where latency is variable, a server round-trip for obviously missing required fields (empty name, empty email) produces poor UX. The register screen is the first form in Lymoon with three required fields, making the validation strategy explicit for the first time.

## Decision

Form screens validate that all required fields are non-empty client-side before calling `useMutation`. On failure, an inline error message is shown immediately — no network call is made. Domain-level validation (password strength, email uniqueness, display name constraints) is delegated entirely to the server and surfaced via the mutation's `onError` callback.

```typescript
function handleRegister() {
  setErrorMsg(null);
  if (!displayName.trim() || !email.trim() || !password) {
    setErrorMsg('All fields are required.');
    return;          // fast-fail before mutation
  }
  register.mutate(
    { email: email.trim(), password, displayName: displayName.trim() },
    { onError: (err) => setErrorMsg(err.message ?? 'Registration failed') },
  );
}
```

## Alternatives Considered

### Alternative 1: Server-only validation
- **Pros**: Single source of truth; no client/server rule duplication
- **Cons**: Adds a network round-trip for obviously incomplete inputs; spinner appears then disappears with a trivial error; bad on high-latency mobile connections
- **Why not**: The UX cost is not worth it for "field is empty" errors which require no server knowledge to detect

### Alternative 2: Full schema validation (e.g., Zod on the client)
- **Pros**: Catches format errors (invalid email pattern, password length) without a network call; typed schemas
- **Cons**: Duplicates server validation rules; two sources of truth can drift; adds a dependency; over-engineered for MVP with 2 auth screens
- **Why not**: Lymoon's auth forms are simple (3 fields max). Schema validation is the right call once form complexity grows, but premature at MVP stage.

## Consequences

### Positive
- Zero-latency feedback for empty required fields — no spinner, no round-trip
- Server validation remains the authoritative source for domain rules; no duplication of business logic
- Pattern is clear and consistent: client handles presence, server handles correctness

### Negative
- Format errors (invalid email, short password) still require a server round-trip to surface
- The split responsibility (client: presence, server: correctness) must be understood by future contributors

### Risks
- If a field is added to a form, a developer might forget to add it to the client-side check — the server will catch it but UX degrades for that field until fixed
