# Issues — Auth Tasks 4 / 5 / 6

> Source: TypeScript review of Tasks 4 (auth hooks), 5 (login screen), 6 (register screen)
> from `docs/superpowers/plans/2026-03-27-frontend-api-integration.md`
> Date: 2026-03-28

---

## HIGH (resolve before merge)

### H1 — No input validation on login screen before mutate fires
**File:** `app/(auth)/email-login.tsx`

`handleLogin` calls `login.mutate` immediately even when `email` and `password` are empty strings. An empty-string POST hits the network and relies on the server to reject it. The register screen already has an explicit guard (`if (!displayName.trim() || !email.trim() || !password)`); add an equivalent guard to `handleLogin`.

---

### H2 — `err.message ?? fallback` misses empty-string error messages
**Files:** `app/(auth)/email-login.tsx`, `app/(auth)/register.tsx`

Both screens use `err.message ?? 'Login failed'` / `err.message ?? 'Registration failed'`. The `??` operator only catches `null | undefined`, not `""`. Replace with `err.message || 'Login failed'` (and equivalent for register) so an empty message string also falls back correctly.

---

### H3 — `computeInitials` returns `""` for blank `displayName`
**File:** `src/lib/queries/auth.ts`

If the backend ever returns `displayName: ""` or `displayName: "   "`, `computeInitials` yields an empty string and the avatar renders with no initials. Add a guard:

```ts
if (!displayName.trim()) return '?';
```

---

## MEDIUM

### M1 — Double-tap possible between press and `isPending: true`
**Files:** `app/(auth)/email-login.tsx`, `app/(auth)/register.tsx`

`isPending` only becomes `true` after React re-renders following `mutate()`. On a slow device, two rapid taps can both call `mutate`. Fix: add a `useRef<boolean>` submitting guard, or set a local `submitting` state synchronously before `mutate` is called.

---

### M2 — Icon-only back button has no `accessibilityLabel`
**Files:** `app/(auth)/email-login.tsx`, `app/(auth)/register.tsx`

The back button renders only an `<Ionicons>` chevron with no text. Screen readers will announce it as an unlabelled button. Add `accessibilityLabel="Go back"` to the `TouchableOpacity`.

---

### M3 — `AuthResponse` interface defined locally in `auth.ts`
**File:** `src/lib/queries/auth.ts`

`AuthResponse` belongs in `src/types/auth.ts` so it can be reused by the token-refresh flow and any future auth-related mutations without coupling imports to the query file.

---

### M4 — No `autoComplete` prop on `TextInput` fields
**Files:** `app/(auth)/email-login.tsx`, `app/(auth)/register.tsx`

Without `autoComplete`, OS-level autofill (iCloud Keychain, Google Autofill, password managers) does not activate. Correct values:
- Display name → `autoComplete="name"`
- Email → `autoComplete="email"`
- Login password → `autoComplete="current-password"`
- Register password → `autoComplete="new-password"`

---

### M5 — Hardcoded-role comment missing on `useRegisterMutation`
**File:** `src/lib/queries/auth.ts`

`useLoginMutation` has the comment `// role is per-schedule; authStore holds a fallback` explaining why `userRole` is hardcoded to `'Member'`. The same comment is absent on `useRegisterMutation`. Add it for parity.

---

### M6 — No `returnKeyType` / `onSubmitEditing` keyboard chain
**Files:** `app/(auth)/email-login.tsx`, `app/(auth)/register.tsx`

Neither screen chains the keyboard `Return` key between fields or triggers form submission from the last field. Standard approach:
- Non-final inputs: `returnKeyType="next"` + `onSubmitEditing` focusing the next `TextInput` ref
- Final input: `returnKeyType="done"` triggering the submit handler

---

## LOW

### L1 — Register "Sign In" link uses `router.back()` instead of explicit route
**File:** `app/(auth)/register.tsx`

`router.back()` is fragile if the register screen is ever reached from somewhere other than the email-login screen. Use `router.replace('/(auth)/email-login')` for a deterministic destination.

---

### L2 — No `KeyboardAvoidingView` on auth screens
**Files:** `app/(auth)/email-login.tsx`, `app/(auth)/register.tsx`

On smaller devices the software keyboard will overlap the submit button and the bottom link. Wrap content in `KeyboardAvoidingView` with `behavior="padding"` (iOS) / `behavior="height"` (Android), or use a `ScrollView`.

---

### L3 — Runtime cast in `handleResponse` has no shape validation
**File:** `src/lib/api.ts`

`return res.json() as Promise<T>` is a TypeScript-only cast. If the backend returns an unexpected shape (e.g., a 200 with a non-auth body), `data.accessToken` will be `undefined` at runtime while TypeScript believes it is a `string`. Consider adding a minimal runtime check in `onSuccess` before calling `setUser`.

---

## Status

| ID | Severity | Status |
|----|----------|--------|
| H1 | HIGH | Resolved |
| H2 | HIGH | Resolved |
| H3 | HIGH | Resolved |
| M1 | MEDIUM | Resolved |
| M2 | MEDIUM | Resolved |
| M3 | MEDIUM | Resolved |
| M4 | MEDIUM | Resolved |
| M5 | MEDIUM | Resolved |
| M6 | MEDIUM | Resolved |
| L1 | LOW | Resolved |
| L2 | LOW | Resolved |
| L3 | LOW | Accepted (MVP tech debt) |
