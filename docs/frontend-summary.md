# Frontend Summary — Entities, API Calls & Screen Map

> Generated from `lymoon-mobile` source scan (2026-03-25).
> Purpose: backend development reference — maps every frontend data need to its corresponding API contract.

---

## 1. TypeScript Entities (from `src/types/schedule.ts` & stores)

### User / Auth (`src/stores/authStore.ts`)
```ts
interface AuthState {
  userId: string;         // maps to AspNetUsers.Id
  userName: string;       // display name
  userRole: 'Manager' | 'Member';  // role within the current schedule
  avatarInitials: string; // e.g. "AR" derived from displayName
}
```
> Currently seeded with mock data. Needs to be populated from `POST /api/auth/login` response.

---

### Schedule (`src/types/schedule.ts`)
```ts
type ScheduleItem = {
  id: string;
  title: string;
  // NOTE: `subtitle` exists in the frontend type but is a UI display string
  // computed locally from other fields — it is NOT returned by the API.
  // The user-authored text field is `description`.
  hours: string;                // total hours for the current user in currentWeek, e.g. "38.5"
  iconBg: string;               // color token for icon background
  days: DayBar[];               // 7-element array computed from current user's shifts in currentWeek
  scheduleType?: 'shift' | 'event' | 'personal';
  memberPermission?: 'manager_only' | 'full_collaboration';
  startWeek?: string;           // ISO Monday date — week the schedule was created for
  currentWeek?: string;         // ISO Monday date — latest active week, advances on Add Next Week
  description?: string;         // optional user-provided text, max 20 words
  inviteCode?: string;          // 6-char uppercase alphanumeric, e.g. "A3BK9Z"
};

type DayBar = {
  day: string;    // "Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su"
  opacity: number; // 0–1, proportional to hours worked that day
  isToday?: boolean;
};

type ScheduleDetail = ScheduleItem & {
  employees: Employee[];
  shifts: Shift[];
  weekStartDate: string; // ISO date "2024-10-14" (always a Monday)
};
```

---

### Employee (`src/types/schedule.ts`)
```ts
type Employee = {
  id: string;           // maps to AspNetUsers.Id
  name: string;         // display name
  role: string;         // job title, e.g. "Lead Developer"
  avatarInitials: string;
};
```

---

### Shift (`src/types/schedule.ts`)
```ts
type Shift = {
  id: string;
  userId: string;       // maps to AspNetUsers.Id
  dayOfWeek: number;    // 0 = Mon … 6 = Sun
  startTime: string;    // "HH:mm", e.g. "09:00"
  endTime: string;      // "HH:mm", e.g. "13:00"
};
```

---

### Schedule Categories & Permissions (constants)
```ts
type ScheduleCategory = 'All' | 'Shift' | 'Event' | 'Personal';
type MemberPermission = 'manager_only' | 'full_collaboration';
type UserRole = 'Manager' | 'Member';
```

---

### Schedule Store State (`src/stores/scheduleStore.ts`)
```ts
interface ScheduleState {
  schedules: ScheduleItem[];
  shiftsBySchedule: Record<string, Shift[]>;      // scheduleId → shifts
  employeesBySchedule: Record<string, Employee[]>; // scheduleId → employees
}
```
> All currently in-memory Zustand state. Needs to be replaced with TanStack Query + backend API calls.

---

## 2. API Calls by Screen

### Auth Screens

| Screen | Action | API Call | Status |
|--------|--------|----------|--------|
| `(auth)/login.tsx` | Google login | `POST /api/auth/google` body: `{ idToken }` | TODO |
| `(auth)/login.tsx` | Apple login | `POST /api/auth/apple` body: `{ idToken }` | TODO |
| `(auth)/login.tsx` | Navigate to email login | — (local nav) | — |
| `(auth)/email-login.tsx` | Sign in | `POST /api/auth/login` | TODO (hardcoded console.log) |
| `(auth)/email-login.tsx` | Navigate to register | `POST /api/auth/register` | TODO (screen not built) |

---

### Home Screen (`(app)/index.tsx`)

| Action | API Call | Status |
|--------|----------|--------|
| Load schedule list | `GET /api/schedules` | TODO (Zustand mock) |
| Filter by category | client-side filter | — |
| Search schedules | client-side filter | — |

---

### Create Schedule (`(app)/create-schedule.tsx`)

| Action | API Call | Status |
|--------|----------|--------|
| Create schedule | `POST /api/schedules` | TODO (Zustand mock) |

**Request payload constructed by frontend:**
```json
{
  "title": "string (required)",
  "description": "string | null (max 20 words)",
  "scheduleType": "shift | event | personal",
  "startWeek": "YYYY-MM-DD (ISO Monday)",
  "memberPermission": "manager_only | full_collaboration",
  "iconBg": "string (color token, e.g. \"#FF6B6B\", chosen by client and stored as-is)"
}
```

---

### Join Schedule (`app/join-schedule.tsx`)

Two-step flow:

| Step | Action | API Call | Status |
|------|--------|----------|--------|
| 1. Search | Look up schedule by invite code | `GET /api/schedules/lookup?code={inviteCode}` | TODO (mock setTimeout) |
| 2. Join | Join the found schedule | `POST /api/schedules/join` | TODO (mock setTimeout) |

**Lookup response needed by frontend:**
```json
{
  "scheduleName": "string",
  "managerName": "string",
  "memberCount": 5
}
```

**Join states handled by frontend:**
- `200` — joined successfully → show success, navigate back
- `409` — already a member → show "You're already a member" state
- `404` — invalid code → show error message

---

### Schedule Created (`(app)/schedule-created.tsx`)

| Action | API Call | Status |
|--------|----------|--------|
| Display created schedule | reads from Zustand store | TODO (needs API after create) |
| Copy invite code | local clipboard | — |
| Open schedule | navigate to `/schedule/{id}` | — |

---

### Schedule Detail (`(app)/schedule/[id].tsx`)

| Action | API Call | Status |
|--------|----------|--------|
| Load schedule + shifts + employees | `GET /api/schedules/{id}?weekStart=YYYY-MM-DD` | TODO (Zustand mock) |
| Add shift | `POST /api/schedules/{id}/shifts` | TODO (Zustand mock) |
| Edit shift | `POST /api/shifts/{shiftId}/update` | TODO (Zustand mock) |
| Delete shift | `POST /api/shifts/{shiftId}/delete` | TODO (Zustand mock) |
| Rename schedule | `POST /api/schedules/{id}/rename` | TODO (explicit comment) |
| Leave schedule | `POST /api/schedules/{id}/leave` | TODO (explicit comment) |
| **Add next week** (Manager only) | `POST /api/schedules/{id}/weeks` — advances `currentWeek` +7 days, no body | TODO (currently just shifts week offset locally) |
| View members | `GET /api/schedules/{id}/members` | TODO (Zustand mock) |
| View work hours (per member) | `GET /api/schedules/{id}/members/{userId}/work-hours` | TODO (MOCK_WORK_HOURS_HISTORY mock) |
| Remove member (Manager only) | `POST /api/schedules/{id}/members/remove` | TODO (Zustand mock) |
| Copy invite code | local clipboard | — |
| Navigate weeks | adds `weekStart` query param | — |

**Authorization logic in frontend (must mirror backend):**
```
isManager = (userRole === 'Manager')
isFullCollab = (memberPermission === 'full_collaboration')
canEditShifts = isManager || isFullCollab
canEditOwnShift = (shift.userId === userId)
canEdit = canEditShifts || canEditOwnShift
```

---

### Notifications (`(app)/notifications` — polling)

| Action | API Call | Status |
|--------|----------|--------|
| Load notifications (polled every 30s) | `GET /api/notifications` | TODO |
| Mark notifications as read | `POST /api/notifications/read` body: `{ notificationIds: string[] }` | TODO |

---

### Settings & Calendar (`(app)/settings.tsx`, `(app)/calendar.tsx`)
> Both screens are placeholder "Coming soon" — no API calls yet.

### Team (`(app)/team/index.tsx`)
> Placeholder "Coming soon" — no API calls yet.

---

## 3. API Gaps (Missing from `docs/API.md`)

> All previously identified gaps are now implemented. No missing endpoints.

---

## 4. Backend DB → Frontend Field Mapping

| DB Column | Frontend Field | Notes |
|-----------|---------------|-------|
| `schedules.id` | `ScheduleItem.id` | |
| `schedules.name` | `ScheduleItem.title` | |
| `schedules.week_start` | `ScheduleItem.startWeek` | ISO Monday date string |
| `schedules.invite_code` | `ScheduleItem.inviteCode` | 6-char uppercase alphanumeric |
| `schedules.description` | `ScheduleItem.description` | optional, max 20 words, user-authored |
| `schedules.current_week` | `ScheduleItem.currentWeek` | advances by 7 days each time Manager adds next week |
| `schedule_members.role` | `AuthState.userRole` | "Manager" \| "Member" |
| `shifts.user_id` | `Shift.userId` | |
| `shifts.day_of_week` | `Shift.dayOfWeek` | 0=Mon … 6=Sun |
| `shifts.start_time` | `Shift.startTime` | "HH:mm" string |
| `shifts.end_time` | `Shift.endTime` | "HH:mm" string |
| `AspNetUsers.id` | `Employee.id` / `AuthState.userId` | |
| `AspNetUsers.display_name` | `Employee.name` / `AuthState.userName` | |

---

## 5. Derived / Computed Fields (backend must compute)

These fields are computed server-side and returned in API responses:

| Field | Logic |
|-------|-------|
| `ScheduleItem.hours` | Sum of `endTime - startTime` for current user's shifts in `currentWeek` |
| `ScheduleItem.days` | 7-element array for `currentWeek`; opacity per day = min(1.0, 0.35 + hours/8 * 0.65) for current user |
| `ScheduleDetail.currentUserRole` | Look up `schedule_members.role` for the authenticated user |
| `Employee.avatarInitials` | First letter of first + last name (e.g. "Alex Rivera" → "AR") |

---

## 6. Authorization Summary

| Operation | Who can do it |
|-----------|--------------|
| Create schedule | Any authenticated user (becomes Manager) |
| Rename schedule | Manager only |
| Delete/leave schedule | Manager only (if sole manager, blocked) |
| Add/edit/delete any shift | Manager, OR any member if `memberPermission = full_collaboration` |
| Add/edit/delete own shift | Any member (regardless of permission) |
| View schedule + shifts + members | Any schedule member |
| Remove member | Manager only |
| Join schedule | Any authenticated user with valid invite code |
