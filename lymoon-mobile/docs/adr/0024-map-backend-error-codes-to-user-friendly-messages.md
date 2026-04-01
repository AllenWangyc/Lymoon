# ADR-0024: Map Backend Error Codes to User-Friendly Messages on the Frontend

**Date**: 2026-03-31
**Status**: accepted
**Deciders**: Allen

## Context

The backend API returns machine-readable error codes (e.g., `invalid_credentials`, `email_taken`, `sole_manager`) in the `{ "error": "..." }` response body. These codes are designed for programmatic handling, not direct display. If the frontend passes them to the UI without mapping, users see raw identifiers like "invalid_credentials" or "sole_manager" — which is confusing and unprofessional. The issue was discovered when incorrect password input produced "invalid_credentials" visible to end users.

## Decision

The frontend is responsible for mapping all backend error codes to user-friendly messages before displaying them. No raw backend error string may be rendered directly in the UI.

## Alternatives Considered

### Alternative 1: Return human-readable messages directly from the backend
- **Pros**: No mapping logic needed in the frontend
- **Cons**: Ties the backend to UI language and locale; makes i18n harder; mixes presentation concerns into the API layer; error strings become part of the API contract
- **Why not**: The backend is a shared API layer. Presentation is the frontend's responsibility.

### Alternative 2: Use error codes + a shared i18n map (frontend + backend agree on codes)
- **Pros**: Clean separation; supports multiple languages
- **Cons**: Overkill for an MVP-stage app; requires coordinating a shared schema
- **Why not**: Complexity not justified at current scale. Revisit when i18n is required.

## Consequences

### Positive
- Users never see raw technical identifiers
- Backend error codes remain stable internal contracts, not UI copy
- Error messages can be improved without touching the API

### Negative
- Every new backend error code must be explicitly handled in the frontend — it won't "just work" if forgotten

### Risks
- A new backend error code added without a corresponding frontend mapping will fall through to a generic fallback message. Mitigation: the generic fallback ("Please try again.") is always present and acceptable, but developers should audit new error codes during PR review.
