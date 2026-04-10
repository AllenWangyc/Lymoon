# Settings Page — Additional Features Design

**Date:** 2026-04-10
**Scope:** Email display (read-only), Privacy Policy / Terms of Service links, Delete account

---

## Context

The MVP settings page was implemented with: profile card, edit display name, log out, and app version. This spec adds three further features: surfacing the user's email in the UI, legal links for App Store compliance, and account deletion (also required by Apple App Store guidelines).

---

## Feature 1 — Email Display (Read-Only)

### What
Show the authenticated user's email address in the profile card, below their display name. Read-only — no editing.

### Data flow
- `user.email` is already returned in the login/register API response (`AuthResponse.User.Email`) but is not currently stored in the auth store.
- Add `userEmail: string | null` to `AuthState` in `authStore.ts`.
- Populate it in `setUser()`.
- Feed it from `onSuccess` in `useLoginMutation` and `useRegisterMutation` in `auth.ts`.

### UI
- Second line in the profile card, below the display name.
- Smaller font, muted color (`#64748b`).
- No interaction.

### Backend
None — email is already included in the existing `AuthResponse`.

### Files changed
| File | Change |
|------|--------|
| `src/stores/authStore.ts` | Add `userEmail` field + update `setUser` signature |
| `src/lib/queries/auth.ts` | Pass `userEmail` in `onSuccess` for login + register |
| `app/(app)/settings.tsx` | Render email below display name in profile card |

---

## Feature 2 — Privacy Policy / Terms of Service Links

### What
A "Legal" section at the bottom of the settings screen with two tappable rows that navigate to the existing in-app screens.

### UI
- Section header: "LEGAL" (same style as existing "ACCOUNT" / "APP" headers)
- Row 1: "Privacy Policy" → `router.push('/(auth)/privacy')`
- Row 2: "Terms of Service" → `router.push('/(auth)/terms')`
- Each row has a `›` chevron, same layout as other settings rows.

### Backend
None.

### Files changed
| File | Change |
|------|--------|
| `app/(app)/settings.tsx` | Add Legal section with two rows |

---

## Feature 3 — Delete Account

### What
Allow a user to permanently and irreversibly delete their account. Required by Apple App Store guidelines for apps with account creation.

### Constraints
- **Sole manager block**: If the user is the sole manager of one or more schedules, deletion is blocked. They must transfer the manager role or dissolve those schedules first. This mirrors the existing `SoleManagerLeaveSheet` pattern.
- **Hard delete**: All user data is removed from the database. No soft-delete or retention period.

### UI flow
1. "Delete Account" row in the Account section (below Log Out), text in red.
2. Tap → open `DeleteAccountSheet` (bottom sheet).
3. Sheet content:
   - Title: **"Delete Account"**
   - Warning list:
     - "Your schedules"
     - "Your shifts"
     - "Your data"
   - Text input: placeholder `"Type DELETE to confirm"` — the Delete Account button is disabled until the input value equals exactly `"DELETE"`.
   - Primary button: **"Delete Account"** (red, full-width) — disabled + low opacity until input matches.
   - Tapping outside or a Cancel affordance closes the sheet without action.
4. Confirm (input = "DELETE", button pressed) → call `DELETE /api/account`.
5. **If backend returns `sole_manager_blocking`**: Close sheet, show `Alert.alert` listing the blocking schedule titles: *"You are the sole manager of: [X, Y]. Transfer the manager role or dissolve these schedules before deleting your account."*
6. **On success**: `clearUser()` + `router.replace('/(auth)/login')`.

### Backend endpoint

`DELETE /api/account`

- **Auth:** Bearer JWT required
- **Response 200:** `{}`
- **Response 409:** `{ "error": "sole_manager_blocking", "schedules": ["Schedule A", "Schedule B"] }`

**Deletion steps (in order):**
1. Query `schedule_members` where `userId = currentUser` and `role = Manager`.
2. For each such schedule, check if there is any other Manager. If none → add to blocking list.
3. If blocking list is non-empty → return 409 with schedule titles (no transaction needed — nothing has been written).
4. Otherwise, execute steps 4a–4d inside a **single database transaction**:
   - 4a. Delete all `shifts` where `userId = currentUser`
   - 4b. Delete all `notifications` where `userId = currentUser`
   - 4c. Delete all `schedule_members` rows where `userId = currentUser`
   - 4d. Delete `AppUser` via `UserManager.DeleteAsync` (EF Core participates in the same `DbContext` transaction)
5. Commit transaction. Return 200.

> **Transaction note:** Use `await _context.Database.BeginTransactionAsync()` and wrap steps 4a–4d in a try/commit/rollback block. `UserManager.DeleteAsync` uses the same `DbContext` instance injected by DI, so it participates in the ambient transaction automatically.

### New backend DTO

`DeleteAccountResponse409`:
```json
{
  "error": "sole_manager_blocking",
  "schedules": ["Cafe Rota", "Weekend Team"]
}
```

### Files changed

| File | Change |
|------|--------|
| `Lymoon.API/Services/IAccountService.cs` | Add `DeleteAccountAsync(string userId)` |
| `Lymoon.API/Services/AccountService.cs` | Implement deletion logic |
| `Lymoon.API/Controllers/AccountController.cs` | Add `DELETE /api/account` endpoint |
| `Lymoon.API/Data/AppDbContext.cs` | Reference (read existing context for query patterns) |
| `src/features/settings/components/DeleteAccountSheet.tsx` | New bottom sheet with warning list + "DELETE" typed confirmation |
| `src/lib/queries/account.ts` | Add `useDeleteAccountMutation` hook |
| `app/(app)/settings.tsx` | Add Delete Account row, open sheet on tap, handle 409 alert |
| `docs/API.md` | Document new endpoint |

---

## Settings Screen Layout (final)

```
Profile card
  [Avatar]  Display Name
            email@example.com

── ACCOUNT ──────────────────────────
  Edit Display Name              ›
  ─────────────────────────────────
  Log Out                    (red)
  ─────────────────────────────────
  Delete Account             (red)

── APP ──────────────────────────────
  Version                    1.0.0

── LEGAL ────────────────────────────
  Privacy Policy                 ›
  ─────────────────────────────────
  Terms of Service               ›
```

---

## Out of Scope

- Email editing
- Password change
- Notification preferences
- Avatar color picker
