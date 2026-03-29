# ADR-0008: Minimal Two-File API Layer Over Interceptor Pipeline

**Date**: 2026-03-28
**Status**: accepted
**Deciders**: Allen

## Context

The mobile client needs a centralized fetch wrapper that (1) attaches the JWT `Authorization` header,
(2) handles 401 responses by attempting a silent token refresh and retrying, and (3) surfaces
API errors consistently. The original `api.ts` had these concerns mixed together with ~4× duplicated
error-handling blocks and `tryRefresh` buried inline, making the file hard to test and maintain.

The question was how much abstraction to introduce: a minimal refactor, or a full axios-style
interceptor pipeline.

## Decision

We split the fetch wrapper into exactly two files:

- **`src/lib/tokenRefresh.ts`** — isolated `tryRefresh()` function; calls `/auth/refresh`, updates Zustand, returns a boolean.
- **`src/lib/api.ts`** — exports `API_BASE`, a private `handleResponse<T>` helper, a private `fetchWithAuth` dispatcher, and four thin public methods (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`).

No interceptor pipeline, no middleware chain.

## Alternatives Considered

### Alternative 1: Axios with interceptors
- **Pros**: Familiar pattern; interceptors are composable; request/response transformation is straightforward.
- **Cons**: Adds an external dependency; an interceptor pipeline for exactly 2 concerns (auth + error) would add ~60 lines of boilerplate.
- **Why not**: Overkill for MVP scope. TanStack Query already handles retry and error state at the query layer; duplicating that in an interceptor pipeline adds complexity with no user-visible benefit.

### Alternative 2: Keep everything in one `api.ts` file (no split)
- **Pros**: Fewer files; simpler import graph.
- **Cons**: `tryRefresh` is only callable from within `api.ts`, making it untestable in isolation. The circular dependency risk (api.ts importing authStore which might someday import api.ts) is harder to break.
- **Why not**: The circular dependency `tokenRefresh.ts → api.ts (API_BASE)` and `api.ts → tokenRefresh.ts` is explicit and contained. Isolating refresh logic makes it independently testable and swappable.

### Alternative 3: Full middleware/plugin system (ky, wretch)
- **Pros**: Ergonomic plugin API; built-in retry, timeout, hooks.
- **Cons**: Another dependency; learning curve; plugin system generalizes beyond what we need.
- **Why not**: The project has exactly one backend with one auth scheme. A plugin system optimizes for variability we don't have.

## Consequences

### Positive
- `handleResponse<T>` eliminates 4× duplicated error-handling blocks — single place to change error parsing.
- `tryRefresh` is independently testable without mocking the entire fetch layer.
- Four one-liner public methods (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`) are easy to audit.
- No new runtime dependencies.

### Negative
- `tokenRefresh.ts` imports `API_BASE` from `api.ts`, creating a circular module reference. This is safe at runtime (Expo/Metro resolves it correctly because `API_BASE` is a const evaluated before either module's functions run), but it is non-obvious and must not be deepened.

### Risks
- If a future engineer adds Zustand store imports inside `api.ts` that transitively import `tokenRefresh.ts`, the circular dependency could cause initialization-order bugs. Mitigation: `API_BASE` should be extracted to a dedicated `src/lib/config.ts` if the graph grows.
