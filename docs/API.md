# Lymoon API Reference

All endpoints require `Authorization: Bearer <accessToken>` unless noted.

Error responses always follow the shape: `{ "error": "<error_code>" }`

---

## Account

### PATCH /api/account/display-name

Update the authenticated user's display name.

**Auth:** Required

**Request body:**
```json
{ "displayName": "New Name" }
```

| Field | Type | Constraints |
|-------|------|-------------|
| displayName | string | 1–50 chars (after trim) |

**Response 200:**
```json
{ "displayName": "New Name" }
```

**Errors:**

| Status | error | Meaning |
|--------|-------|---------|
| 400 | `display_name_empty` | Trimmed value is empty |
| 400 | `display_name_too_long` | Exceeds 50 characters |
| 401 | — | Missing or invalid JWT |

### DELETE /api/account

Permanently deletes the authenticated user's account and all associated data.

**Auth:** Required

**Request body:** none

**Response 200:**
```json
{}
```

**Response 409 — sole manager blocking:**
```json
{
  "error": "sole_manager_blocking",
  "schedules": ["Cafe Rota", "Weekend Team"]
}
```

**Errors:**

| Status | error | Meaning |
|--------|-------|---------|
| 409 | `sole_manager_blocking` | User is sole manager of one or more schedules — must transfer or dissolve them first |
| 401 | — | Missing or invalid JWT |

**Deletion order (transactional):**
1. shifts where userId = currentUser
2. notifications where userId = currentUser
3. schedule_members where userId = currentUser
4. AppUser row

### DELETE /api/notifications

Permanently deletes all notifications for the authenticated user.

**Auth:** Required

**Request body:** none

**Response 204:** No Content

**Errors:**

| Status | Meaning |
|--------|---------|
| 401 | Missing or invalid JWT |
