# Design: Dissolve Schedule & Transfer Manager

**Date:** 2026-04-08  
**Status:** Approved

---

## Context

Schedule Managers need two power operations currently missing from the app:

1. **Dissolve Schedule** — permanently delete a schedule along with all its shifts and members. Useful when a team wraps up or a schedule was created in error.
2. **Transfer Manager** — hand over Manager role to a Member, with the original Manager downgraded to Member. Useful for ownership handoffs.

Both operations are restricted to any Manager (no separate "owner" concept). The design follows existing UI patterns in the codebase (`ConfirmActionSheet`, `ViewMembersSheet` state machine).

---

## Feature 1: Dissolve Schedule

### UI Entry Point

`ScheduleOptionsMenu` (three-dot menu on schedule detail page) — new **"Dissolve Schedule"** item:
- Red text color
- Positioned at the bottom of the list, separated by a divider
- Visible only to Managers

### Double Confirmation Flow

**Step 1 — First ConfirmActionSheet:**
- Icon: red background + `warning` icon
- Title: `Dissolve Schedule?`
- Body: `This will permanently delete all shifts and remove all members. This action cannot be undone.`
- Buttons: red `Dissolve` / gray `Cancel`
- Tapping `Dissolve` does NOT call the API — it closes this sheet and opens Step 2.

**Step 2 — Second ConfirmActionSheet:**
- Icon: red background + `trash` icon
- Title: `Are you absolutely sure?`
- Body: `You're about to dissolve "{scheduleName}". All data will be lost forever.`
- Buttons: red `Yes, Dissolve` (with loading state `Dissolving…`) / gray `Cancel`
- Tapping `Yes, Dissolve` calls the API.

### Post-Execution Behavior

| Outcome | Behavior |
|---------|----------|
| Success | `router.replace('/')`, invalidate schedule list query |
| Error | Toast with error message, sheet stays open |

### Backend API

```
DELETE /api/schedules/{id}
Authorization: Bearer <token> — Manager only
Response 200: { "ok": true }
Response 403: { "error": "unauthorized" }
```

**Backend logic:**
1. Verify requester is a Manager of this schedule (outside transaction — read-only guard)
2. Collect all member IDs (excluding requester) for notification targets
3. Wrap steps 4–7 in a single EF Core database transaction (`BeginTransactionAsync`):
   - Insert `schedule_dissolved` notifications for all collected member IDs
   - Delete all `shifts` for this schedule
   - Delete all `schedule_members` for this schedule
   - Delete the `schedule` record
   - `SaveChangesAsync` + `CommitAsync`
4. On any exception: `RollbackAsync` + rethrow — no partial state is persisted

> **Why transaction:** The delete sequence (shifts → members → schedule) and notification inserts must be atomic. A partial failure would leave orphaned data or send notifications for a schedule that was not fully dissolved.

### Notification

| Event | Recipients | Type |
|-------|-----------|------|
| Schedule dissolved | All members except the dissolving Manager | `schedule_dissolved` |

---

## Feature 2: Transfer Manager

### UI Entry Point

`ViewMembersSheet` — three-dot menu (`OptionsMenuCard`) on each member card.

**Visibility rules:**
- Only visible to the current user if they are a Manager
- Not shown on the current user's own card
- Not shown on cards of other existing Managers (only Members can receive the transfer)

### Confirmation Flow (Single Step)

`ViewMembersSheet` adds a new internal state `confirmTransferTarget` (mirrors existing `removeTarget` pattern).

Tapping "Transfer Manager" transitions the sheet to **`ConfirmTransferView`**:
- Icon: yellow/amber background + `shield-checkmark-outline` icon
- Title: `Transfer Manager to {name}?`
- Body: `{name} will become the Manager. You will become a Member and lose manager permissions.`
- Buttons: primary `Transfer` (with loading state `Transferring…`) / gray `Cancel`

Single-step confirmation is sufficient — the operation is effectively reversible (the new Manager can transfer back).

### Post-Execution Behavior

| Outcome | Behavior |
|---------|----------|
| Success | Close sheet, invalidate `scheduleKeys.detail` + `scheduleKeys.members` |
| Error | Toast with error message, sheet stays open |

On success, `currentUserRole` in the schedule detail page automatically reflects `Member` after the detail query refetches, hiding all Manager-only UI.

### Backend API

```
POST /api/schedules/{id}/members/transfer-manager
Authorization: Bearer <token> — Manager only
Body: { "userId": "string" }
Response 200: { "ok": true }
Response 403: { "error": "unauthorized" }
Response 400: { "error": "target_is_already_manager" }
Response 404: { "error": "member_not_found" }
```

**Backend logic (sequential):**
1. Verify requester is a Manager of this schedule
2. Verify target user is a Member (not already a Manager) — return `target_is_already_manager` if so
3. Verify target user is a member of this schedule — return `member_not_found` if not
4. Set requester's `scheduleRole` → `Member`
5. Set target's `scheduleRole` → `Manager`
6. Insert `became_manager` notification for target

### Notification

| Event | Recipient | Type |
|-------|----------|------|
| Became Manager | Target user | `became_manager` |

---

## Files to Modify

### Frontend
| File | Change |
|------|--------|
| `app/(app)/schedule/[id].tsx` | Add Dissolve double-confirmation state + sheet orchestration |
| `src/features/schedule/components/ViewMembersSheet.tsx` | Add `confirmTransferTarget` state + `ConfirmTransferView` |
| `src/features/schedule/components/ScheduleOptionsMenu.tsx` | Add "Dissolve Schedule" menu item |
| `src/lib/queries/schedules.ts` | Add `useDissolveSchedule` and `useTransferManager` mutations |

### Backend
| File | Change |
|------|--------|
| `Controllers/SchedulesController.cs` | Add `DELETE /{id}` and `POST /{id}/members/transfer-manager` endpoints |
| `Services/ScheduleService.cs` | Add `DissolveScheduleAsync` and `TransferManagerAsync` methods |
| `Models/Notification.cs` | Add `schedule_dissolved` and `became_manager` notification types (if enum) |

### Docs
| File | Change |
|------|--------|
| `docs/API.md` | Document both new endpoints |

---

## Verification

1. **Dissolve:** Manager taps three-dot → "Dissolve Schedule" → two confirmation sheets appear in sequence → on final confirm, schedule disappears from all members' lists and `schedule_dissolved` notification appears in their notification center.
2. **Transfer:** Manager opens member list → taps three-dot on a Member → "Transfer Manager" → confirm → that member now shows "Manager" badge; original Manager's three-dot menu no longer shows Manager-only actions.
3. **Guard cases:** Non-Manager cannot see either option. "Transfer Manager" is not shown on existing Manager cards. Dissolve API returns 403 for non-Managers.
