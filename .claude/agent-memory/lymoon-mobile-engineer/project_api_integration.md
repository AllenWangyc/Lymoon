---
name: Frontend API integration task status
description: Tracks what has been built for the frontend-backend API integration plan
type: project
---

`src/lib/api.ts` was created as the central fetch wrapper for all API calls. It exports `apiGet`, `apiPost`, `apiPatch`, `apiDelete` — all route through `fetchWithAuth` which attaches the JWT `Authorization` header and handles 401 → token refresh → retry automatically. `tryRefresh` calls `POST /api/auth/refresh` and on failure calls `clearUser()` to reset auth state.

**Why:** All TanStack Query hooks must go through this wrapper rather than raw `fetch`, per project convention.

**How to apply:** Every new query hook in `src/lib/queries/` must import and use `apiGet`/`apiPost`/`apiPatch`/`apiDelete` from `@/lib/api` — never call `fetch` directly.

`src/stores/authStore.ts` was rewritten from a mock-seeded stub to the full production shape with nullable fields and three actions: `setUser`, `setTokens`, `clearUser`. The old store had hardcoded mock user data (`userId: 'emp-1'`, `userName: 'Alex Rivera'`) with no token fields and no actions at all.

Consuming call sites (`HomeHeader.tsx`, `schedule/[id].tsx`) use non-null assertions (`!`) when reading fields that are guaranteed non-null post-login — this is the established pattern for authenticated-only screens.
