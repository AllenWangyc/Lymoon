# Lymoon API Contract

This document defines all API endpoints required by the mobile frontend. It serves as the contract between `lymoon-mobile` and `Lymoon.API`.

## Overview

- **Base URL:** `http://localhost:5000/api` (dev) / `https://<production-domain>/api` (prod)
- **Auth:** All endpoints except `POST /api/auth/*` require `Authorization: Bearer <jwt>` header
- **Content-Type:** `application/json` for all requests and responses
- **Methods:** Only `GET` and `POST` are used across the entire API
- **Error shape:** All errors return `{ "error": "<message>" }` with an appropriate HTTP status code

---

## Authentication

### Register
`POST /api/auth/register`

**Request body:**
```json
{
  "email": "string",
  "password": "string",
  "displayName": "string"
}
```

**Constraints:**
| Field | Rules |
|-------|-------|
| `email` | Required. Must be a valid email address. |
| `password` | Required. Min 6 characters, max 100 characters. |
| `displayName` | Required. Max 50 characters. |

**Response `200`:**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "string",
    "email": "string",
    "displayName": "string"
  }
}
```

---

### Login
`POST /api/auth/login`

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Constraints:**
| Field | Rules |
|-------|-------|
| `email` | Required. Must be a valid email address. |
| `password` | Required. |

**Response `200`:**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "string",
    "email": "string",
    "displayName": "string"
  }
}
```

---

### Refresh Token
`POST /api/auth/refresh`

**Request body:**
```json
{
  "refreshToken": "string"
}
```

**Response `200`:**
```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

---

## Schedules

### List User's Schedules
`GET /api/schedules`

Returns all schedules the authenticated user is a member of. All computed fields (`hours`, `days`) are based on `currentWeek` — the latest week of the schedule.

**Response `200`:**
```json
[
  {
    "id": "string",
    "title": "string",
    "hours": "string",             // total hours for the current user in currentWeek, e.g. "38.5"
    "iconBg": "string",            // e.g. "rgba(182,236,19,0.1)"
    "days": [
      { "day": "Mo", "opacity": 1, "isToday": false }
    ],                             // 7-element array computed from current user's shifts in currentWeek
    "scheduleType": "shift | event | personal",
    "memberPermission": "manager_only | full_collaboration",
    "startWeek": "2026-03-16",     // ISO Monday date — the week the schedule was created for
    "currentWeek": "2026-03-23",   // ISO Monday date — the latest active week (advances on Add Next Week)
    "description": "string | null", // optional, max 200 characters, user-authored
    "inviteCode": "string"         // 6-char uppercase alphanumeric
  }
]
```

---

### Create Schedule
`POST /api/schedules`

**Request body:**
```json
{
  "title": "string",
  "description": "string | null",
  "scheduleType": "shift | event | personal",
  "startWeek": "2026-03-16",
  "memberPermission": "manager_only | full_collaboration",
  "iconBg": "string"
}
```

**Constraints:**
| Field | Rules |
|-------|-------|
| `title` | Required. Max 100 characters. |
| `description` | Optional. Max 200 characters. |
| `scheduleType` | Required. Must be one of: `shift`, `event`, `personal`. |
| `startWeek` | Required. ISO date string (`YYYY-MM-DD`). Must be a Monday. |
| `memberPermission` | Required. Must be one of: `manager_only`, `full_collaboration`. |
| `iconBg` | Required. CSS color string (e.g. `"rgba(182,236,19,0.1)"`). |

**Response `200`:**
```json
{
  "id": "string",
  "title": "string",
  "hours": "0",
  "iconBg": "string",
  "days": [ ... ],
  "scheduleType": "string",
  "memberPermission": "string",
  "startWeek": "string",
  "currentWeek": "string",       // same as startWeek on creation
  "description": "string | null",
  "inviteCode": "string"
}
```

---

### Get Schedule Detail
`GET /api/schedules/{id}`

Returns full schedule including all employees and shifts for the requested week. Defaults to `currentWeek` when no `weekStart` is provided. The manager can navigate to any week between `startWeek` and `currentWeek`.

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `weekStart` | `string` | No | ISO Monday date (e.g. `2026-03-16`). Defaults to `currentWeek`. |

**Response `200`:**
```json
{
  "id": "string",
  "title": "string",
  "hours": "string",
  "iconBg": "string",
  "days": [ ... ],
  "scheduleType": "string",
  "memberPermission": "string",
  "startWeek": "string",         // earliest available week
  "currentWeek": "string",       // latest active week — used to gate "+ Next Week" button
  "description": "string | null",
  "inviteCode": "string",
  "weekStartDate": "2024-10-14", // the week whose shifts are returned in this response
  "currentUserRole": "Manager | Member",
  "employees": [
    {
      "id": "string",
      "name": "string",
      "role": "string",
      "avatarInitials": "string"
    }
  ],
  "shifts": [
    {
      "id": "string",
      "employeeId": "string",
      "dayOfWeek": 0,            // 0 = Mon … 6 = Sun
      "startTime": "09:00",
      "endTime": "13:00",
      "shiftType": "Morning | Standard | Afternoon | Custom"
    }
  ]
}
```

---

### Rename Schedule
`POST /api/schedules/{id}/rename`

Manager only.

**Request body:**
```json
{
  "title": "string"
}
```

**Constraints:**
| Field | Rules |
|-------|-------|
| `title` | Required. Max 100 characters. |

**Response `200`:**
```json
{ "ok": true }
```

---

### Add Next Week
`POST /api/schedules/{id}/weeks`

Manager only. Advances `currentWeek` by exactly 7 days. Triggered by the "＋ Next Week" button in Schedule Detail. This is a one-way operation — `currentWeek` can only move forward.

No request body required. The backend computes `new currentWeek = currentWeek + 7 days`.

**Response `200`:**
```json
{
  "currentWeek": "2026-03-30"   // the new currentWeek after advancing
}
```

---

## Schedule Membership

### Look Up Schedule by Invite Code
`GET /api/schedules/lookup?code={inviteCode}`

Returns a preview of the schedule before the user joins. Used in the Join Schedule screen's "Search" step.

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | Yes | Exactly 6 characters, uppercase alphanumeric (e.g. `"AB12CD"`). Returns `404` if not found, `409` if already a member. |

**Response `200`:**
```json
{
  "scheduleName": "string",
  "managerName": "string",
  "memberCount": 5
}
```

**Response `404` — code not found:**
```json
{ "error": "invalid_code" }
```

**Response `409` — already a member:**
```json
{ "error": "already_member" }
```

---

### Join Schedule by Invite Code
`POST /api/schedules/join`

Looks up the schedule by invite code and adds the authenticated user as a Member.

**Request body:**
```json
{
  "inviteCode": "string"
}
```

**Constraints:**
| Field | Rules |
|-------|-------|
| `inviteCode` | Required. Exactly 6 characters, uppercase alphanumeric (e.g. `"AB12CD"`). |

**Response `200` — schedule found and joined:**
```json
{
  "id": "string",
  "title": "string",
  "managerName": "string",
  "memberCount": 5
}
```

**Response `409` — already a member:**
```json
{ "error": "already_member" }
```

**Response `404` — code not found:**
```json
{ "error": "invalid_code" }
```

---

### Leave Schedule
`POST /api/schedules/{id}/leave`

Removes the authenticated user from the schedule. A Manager cannot leave if they are the only manager.

**Response `200`:**
```json
{ "ok": true }
```

---

### List Schedule Members
`GET /api/schedules/{id}/members`

**Response `200`:**
```json
[
  {
    "id": "string",
    "name": "string",
    "role": "string",            // job title, e.g. "Lead Developer"
    "avatarInitials": "string",
    "scheduleRole": "Manager | Member"
  }
]
```

---

### Get Member Work Hours
`GET /api/schedules/{id}/members/{userId}/work-hours`

Returns weekly work hour totals for the specified member. The response always covers the current week plus the 3 preceding weeks (4 weeks total), newest first.

Any team member may call this endpoint (not manager-only).

**Response `200`:**
```json
[
  {
    "weekStart": "2026-03-17",   // ISO Monday date, index 0 = current week
    "weekEnd":   "2026-03-23",   // ISO Sunday date
    "totalHours": 38.5
  },
  {
    "weekStart": "2026-03-10",
    "weekEnd":   "2026-03-16",
    "totalHours": 42.0
  },
  {
    "weekStart": "2026-03-03",
    "weekEnd":   "2026-03-09",
    "totalHours": 35.0
  },
  {
    "weekStart": "2026-02-24",
    "weekEnd":   "2026-03-02",
    "totalHours": 40.0
  }
]
```

> `totalHours` is computed server-side by summing `endTime - startTime` for all shifts belonging to the employee within that schedule and week.

---

### Remove Member
`POST /api/schedules/{id}/members/remove`

Manager only.

**Request body:**
```json
{
  "userId": "string"
}
```

**Response `200`:**
```json
{ "ok": true }
```

---

## Shifts

### Add Shift
`POST /api/schedules/{id}/shifts`

**Request body:**
```json
{
  "employeeId": "string",
  "dayOfWeek": 2,              // 0 = Mon … 6 = Sun
  "startTime": "09:00",
  "endTime": "13:00",
  "shiftType": "Morning | Standard | Afternoon | Custom"
}
```

**Constraints:**
| Field | Rules |
|-------|-------|
| `employeeId` | Required. Must be a valid user ID that is a member of the schedule. |
| `dayOfWeek` | Required. Integer 0–6 (0 = Mon, 6 = Sun). |
| `startTime` | Required. 24-hour `"HH:mm"` format. Must be earlier than `endTime`. |
| `endTime` | Required. 24-hour `"HH:mm"` format. Must be later than `startTime`. |
| `shiftType` | Optional. One of: `Morning`, `Standard`, `Afternoon`, `Custom`. Defaults to `Custom`. |

**Response `200`:**
```json
{
  "id": "string",
  "employeeId": "string",
  "dayOfWeek": 2,
  "startTime": "09:00",
  "endTime": "13:00",
  "shiftType": "string"
}
```

---

### Update Shift
`POST /api/shifts/{id}/update`

**Request body:**
```json
{
  "startTime": "09:00",
  "endTime": "13:00",
  "shiftType": "Morning | Standard | Afternoon | Custom"
}
```

**Constraints:**
| Field | Rules |
|-------|-------|
| `startTime` | Required. 24-hour `"HH:mm"` format. Must be earlier than `endTime`. |
| `endTime` | Required. 24-hour `"HH:mm"` format. Must be later than `startTime`. |
| `shiftType` | Optional. One of: `Morning`, `Standard`, `Afternoon`, `Custom`. Defaults to `Custom`. |

**Response `200`:**
```json
{
  "id": "string",
  "employeeId": "string",
  "dayOfWeek": 2,
  "startTime": "09:00",
  "endTime": "13:00",
  "shiftType": "string"
}
```

---

### Delete Shift
`POST /api/shifts/{id}/delete`

**Response `200`:**
```json
{ "ok": true }
```

---

## Notifications

### List Notifications
`GET /api/notifications`

Polled every 30 seconds by the mobile client via TanStack Query `refetchInterval`.

**Response `200`:**
```json
[
  {
    "id": "string",
    "type": "string",            // e.g. "schedule_published"
    "message": "string",
    "isRead": false,
    "createdAt": "2026-03-23T10:00:00Z"
  }
]
```

---

### Mark Notifications as Read
`POST /api/notifications/read`

**Request body:**
```json
{
  "notificationIds": ["string", "string"]
}
```

**Constraints:**
| Field | Rules |
|-------|-------|
| `notificationIds` | Required. Non-empty array of notification ID strings. IDs not belonging to the authenticated user are silently ignored. |

**Response `200`:**
```json
{ "ok": true }
```
