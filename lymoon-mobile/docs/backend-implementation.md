# Backend Implementation Plan
# Lymoon.API — Full Implementation from Skeleton

**Objective:** Implement all API endpoints defined in `docs/API.md` and required by `docs/frontend-summary.md`.
**Generated:** 2026-03-25
**Branch strategy:** Each step is a PR. Execute steps sequentially unless marked parallel.

---

## Current State

**Steps 1, 2, and 2b are complete.** Current deployed state:

- `Program.cs` — fully wired: Identity, EF Core, JWT Bearer, HttpClient, MemoryCache, `UseAuthentication()` + `UseAuthorization()`
- All EF Core models created: `AppUser`, `Schedule`, `ScheduleMember`, `Shift`, `Notification`, `JwtSettings`
- `Data/AppDbContext.cs` — configured with all DbSets and snake_case table names
- Migrations applied: `InitialCreate`, `AddRefreshTokenColumns`, `AddAppleUserId`
- Auth endpoints live: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/google`, `POST /api/auth/apple`
- Services: `AuthService`, `JwtService` (interfaces + implementations)
- DTOs: `DTOs/Auth/` — `RegisterRequest`, `LoginRequest`, `RefreshRequest`, `AuthResponse`, `GoogleSignInRequest`, `AppleSignInRequest`
- Schedules endpoints live: `GET /api/schedules`, `POST /api/schedules`, `GET /api/schedules/{id}`, `POST /api/schedules/{id}/rename`
- Services: `ScheduleService` (interface + implementation)
- DTOs: `DTOs/Schedules/` — `ScheduleItemDto`, `ScheduleDetailDto`, `EmployeeDto`, `ShiftDto`, `DayDto`, `CreateScheduleRequest`, `RenameRequest`
- Helpers: `Helpers/InviteCodeGenerator`, `Helpers/AvatarHelper`
- Migration `AddShiftType` applied — `shifts.ShiftType` column added
- Shifts endpoints live: `POST /api/schedules/{id}/shifts`, `POST /api/shifts/{id}/update`, `POST /api/shifts/{id}/delete`
- Services: `ShiftService` (interface + implementation)
- DTOs: `DTOs/Shifts/` — `AddShiftRequest`, `UpdateShiftRequest`
- Step 4 membership endpoints live: `GET /lookup`, `POST /join`, `POST /{id}/leave`, `GET /{id}/members`, `POST /{id}/members/remove`, `POST /{id}/weeks`
- DTOs added: `LookupResponse`, `JoinRequest`, `JoinResponse`, `MemberDto`, `RemoveMemberRequest`
- Step 6 complete: Notifications service + controller; Work hours endpoint; ShiftService/ScheduleService wired with notification calls
- **All backend steps complete.**

---

## Dependency Order

```
Step 1 (Foundation)
  └─ Step 2 (Auth)
       └─ Step 3 (Schedules Core)
            ├─ Step 4 (Membership & Weeks)  ← depends on Step 3
            ├─ Step 5 (Shifts)              ← depends on Step 3
            └─ Step 6 (Work Hours + Notifications) ← depends on Steps 3 & 5
```

Steps 4, 5 can run in parallel after Step 3 is merged.

---

## Step 1 — Database Foundation & Program.cs Wiring

**Branch:** `feat/backend-step1-foundation`

### Context brief
The backend skeleton has NuGet packages but nothing is wired. This step creates all EF Core entities, `AppDbContext`, Identity setup, JWT configuration, and applies the initial migration.

### DB Schema

> **Design note:** The frontend treats `Schedule` as the top-level multi-tenant entity. Each schedule has its own members (with roles), invite code, and shifts. There is no separate "team" entity exposed to clients — `schedule_members` supersedes `team_members` from the original CLAUDE.md schema.

```
AspNetUsers (Identity managed)
  + DisplayName column (nvarchar, not-null)

schedules
  Id                uuid PK
  Title             text NOT NULL
  Description       text NULL
  ScheduleType      text NOT NULL  -- 'shift' | 'event' | 'personal'
  MemberPermission  text NOT NULL  -- 'manager_only' | 'full_collaboration'
  InviteCode        char(6) UNIQUE NOT NULL  -- uppercase alphanumeric
  IconBg            text NOT NULL  -- color token, chosen by client and stored on creation
  StartWeek         date NOT NULL  -- ISO Monday, week schedule was created for
  CurrentWeek       date NOT NULL  -- ISO Monday, latest active week (advances forward only)
  CreatedById       text NOT NULL FK → AspNetUsers.Id

schedule_members
  ScheduleId  uuid FK → schedules.Id
  UserId      text FK → AspNetUsers.Id
  Role        text NOT NULL  -- 'Manager' | 'Member'
  PRIMARY KEY (ScheduleId, UserId)

shifts
  Id          uuid PK
  ScheduleId  uuid FK → schedules.Id
  UserId      text FK → AspNetUsers.Id
  WeekStart   date NOT NULL  -- ISO Monday — which week this shift belongs to
  DayOfWeek   int NOT NULL   -- 0=Mon … 6=Sun
  StartTime   time NOT NULL  -- stored as TIME
  EndTime     time NOT NULL

notifications
  Id          uuid PK
  UserId      text FK → AspNetUsers.Id
  ScheduleId  uuid FK → schedules.Id
  Type        text NOT NULL
  Message     text NOT NULL
  IsRead      bool NOT NULL DEFAULT false
  CreatedAt   timestamptz NOT NULL DEFAULT now()
```

### Tasks

- [x] Add missing NuGet packages to `Lymoon.API.csproj`:
  - `Microsoft.EntityFrameworkCore.Design` (required for `dotnet ef migrations`)
  - `Microsoft.EntityFrameworkCore.Tools` (required for dotnet-ef CLI)
- [x] Create `Models/AppUser.cs` — extends `IdentityUser`, adds `DisplayName` property (non-null)
- [x] Create `Models/Schedule.cs` — EF entity with all columns above
- [x] Create `Models/ScheduleMember.cs` — composite PK entity
- [x] Create `Models/Shift.cs` — EF entity
- [x] Create `Models/Notification.cs` — EF entity
- [x] Create `Data/AppDbContext.cs` — extends `IdentityDbContext<AppUser>`, configures all DbSets and table names (snake_case)
- [x] Wire `AppDbContext` + Identity in `Program.cs` (connection string from `appsettings.json`)
- [x] Configure JWT Bearer in `Program.cs` (issuer/audience/key from `appsettings`)
- [x] Fix middleware pipeline in `Program.cs` — add `app.UseAuthentication()` **before** `app.UseAuthorization()`
- [x] Add `appsettings.json` JWT + DB connection string placeholders (no real secrets in source)
- [x] Add `JwtSettings` options class (`Models/JwtSettings.cs`)
- [x] Run `dotnet ef migrations add InitialCreate` and verify migration SQL
- [x] Run `dotnet ef database update`

### Verification
```bash
cd Lymoon.API
dotnet build          # Must succeed, zero warnings
dotnet ef migrations list  # Shows "InitialCreate"
```

### Exit criteria
- `dotnet build` clean
- Migration applied, all tables present in DB
- `GET /health` still returns 200

---

## Step 2 — Authentication (Register / Login / Refresh)

**Branch:** `feat/backend-step2-auth`
**Depends on:** Step 1

### Context brief
Wire up ASP.NET Core Identity + JWT token generation. The frontend calls `POST /api/auth/login` and `POST /api/auth/register`. JWT access token + refresh token are returned. Refresh tokens are stored in `AspNetUsers` (via Identity's `SecurityStamp` or a custom `RefreshToken` column).

### Endpoints implemented
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/refresh` | Public |

### Tasks

- [x] Create `DTOs/Auth/RegisterRequest.cs`
- [x] Create `DTOs/Auth/LoginRequest.cs`
- [x] Create `DTOs/Auth/RefreshRequest.cs`
- [x] Create `DTOs/Auth/AuthResponse.cs` (accessToken, refreshToken, user { id, email, displayName })
- [x] Add `RefreshToken` + `RefreshTokenExpiry` columns to `AppUser` model
- [x] Create migration for new columns: `dotnet ef migrations add AddRefreshTokenColumns`
- [x] Create `Services/IJwtService.cs` + `Services/JwtService.cs`
  - `GenerateAccessToken(AppUser)` → signed JWT, 15-min expiry
  - `GenerateRefreshToken()` → cryptographically random string, 7-day expiry
- [x] Add `RefreshToken` (string) + `RefreshTokenExpiry` (DateTimeOffset) columns to `AppUser`
  - Single-device MVP approach: store one refresh token per user directly on `AspNetUsers`
  - 7-day expiry; token is a cryptographically random 64-byte base64 string
  - **Trade-off:** multi-device will require a separate `refresh_tokens` table — consult Allen if multi-device is needed before MVP ships
- [x] Create `Services/IAuthService.cs` + `Services/AuthService.cs`
  - `RegisterAsync(RegisterRequest)` → creates Identity user, returns AuthResponse
  - `LoginAsync(LoginRequest)` → validates credentials, returns AuthResponse
  - `RefreshAsync(RefreshRequest)` → validates refresh token + expiry against `AppUser`, rotates token, returns new AuthResponse
- [x] Create `Controllers/AuthController.cs` (thin — calls service, returns result)
- [x] Register `IAuthService`, `IJwtService` as scoped in `Program.cs`
- [x] Input validation: `[Required]`, `[EmailAddress]`, `[MinLength(6)]` on request DTOs

### Verification
```bash
dotnet build
# Manual curl or .http file:
# POST /api/auth/register → 200 with tokens
# POST /api/auth/login    → 200 with tokens
# POST /api/auth/refresh  → 200 with new tokens
# POST /api/auth/login (wrong password) → 401
```

### Exit criteria
- Register → Login → Refresh cycle works end-to-end
- Wrong password returns 401, not 500
- Access token is a valid JWT with `sub` = userId

---

## Step 2b — Third-Party Auth (Google & Apple Sign In)

**Branch:** `feat/backend-step2b-oauth`
**Depends on:** Step 2
**Parallelizable with:** Step 3

### Context brief
Mobile client (Expo) handles the OAuth flow natively and obtains an ID token from Google/Apple. The client POSTs that ID token to the backend. The backend validates the ID token against Google's or Apple's public key, finds or creates the local `AppUser`, and returns the same `AuthResponse` (access token + refresh token) as the email/password flow.

**Token exchange pattern:**
1. Mobile uses `expo-auth-session` or `@react-native-google-signin/google-signin` to get an ID token
2. Mobile sends `POST /api/auth/google` or `POST /api/auth/apple` with `{ idToken: "..." }`
3. Backend validates the ID token, upserts the user, returns `AuthResponse`

This approach keeps all auth logic server-side. The backend never redirects — it only accepts and validates tokens.

### Endpoints implemented
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/google` | Public |
| POST | `/api/auth/apple` | Public |

### Tasks

**NuGet packages:**
- [x] Add `Google.Apis.Auth` — for server-side Google ID token validation (no ASP.NET OAuth middleware needed)
- [x] Apple uses JWT validation with Apple's public JWKS — no extra package required (use `Microsoft.IdentityModel.Tokens`)

**DTOs:**
- [x] Create `DTOs/Auth/GoogleSignInRequest.cs` — `{ string IdToken }`
- [x] Create `DTOs/Auth/AppleSignInRequest.cs` — `{ string IdToken }`

**Google:**
- [x] Add `GoogleSignInAsync(GoogleSignInRequest)` to `IAuthService` + implement in `AuthService`
  - Validate ID token via `GoogleJsonWebSignature.ValidateAsync(idToken)` — verifies signature, expiry, and audience
  - Extract `email`, `name` (use as `DisplayName`), `sub` (Google user ID) from payload
  - Find existing user by email: if found, return tokens; if not, create new `AppUser` with `EmailConfirmed = true` and a random unusable password (`Guid.NewGuid().ToString()`)
  - Return `AuthResponse` (same shape as email/password login)
- [x] Add `GOOGLE_CLIENT_ID` to `appsettings.json` placeholder — passed as `audience` to `ValidateAsync`

**Apple:**
- [x] Add `AppleSignInAsync(AppleSignInRequest)` to `IAuthService` + implement in `AuthService`
  - Fetch Apple's public keys from `https://appleid.apple.com/auth/keys` (cache with 1-hour TTL)
  - Validate the ID token JWT: check signature, `iss = https://appleid.apple.com`, `aud = <APPLE_APP_BUNDLE_ID>`, expiry
  - Extract `email`, `sub` (Apple user ID) from claims
  - Apple only sends `email` on the first sign-in — store Apple's `sub` in a custom `AppleUserId` column on `AppUser` for future lookups
  - Find existing user by `AppleUserId` first, then fall back to email; create if neither found
  - Return `AuthResponse`
- [x] Add `AppleUserId` (string, nullable) column to `AppUser`
- [x] Create migration: `dotnet ef migrations add AddAppleUserId`
- [x] Add `APPLE_APP_BUNDLE_ID` to `appsettings.json` placeholder

**Controller:**
- [x] Add `POST /api/auth/google` and `POST /api/auth/apple` actions to `AuthController`
  - Both are public (`[AllowAnonymous]`)
  - Input validation: `[Required]` on `IdToken`

### Verification
```bash
dotnet build  # Must succeed, zero warnings
dotnet ef migrations list  # Shows "AddAppleUserId"

# Manual test (use a real short-lived ID token from the mobile client):
# POST /api/auth/google { "idToken": "<valid Google ID token>" } → 200 AuthResponse
# POST /api/auth/google { "idToken": "invalid" }               → 401 { "error": "..." }
# POST /api/auth/apple  { "idToken": "<valid Apple ID token>" } → 200 AuthResponse
```

### Exit criteria
- Invalid or expired ID token → 401 with `{ "error": "..." }`
- First-time Google sign-in creates a new user; second call returns the same user
- First-time Apple sign-in creates a new user; subsequent sign-ins look up by `AppleUserId` (not email, since Apple hides email after the first sign-in)
- Returned `AuthResponse` is identical in shape to the email/password login response

---

## Step 3 — Schedules Core (List / Create / Get Detail / Rename)

**Branch:** `feat/backend-step3-schedules-core`
**Depends on:** Step 2

### Context brief
Implements the four most-used schedule endpoints. After this step the frontend home screen and schedule detail screen can be connected to the real API.

Key computed fields the service must produce:
- `hours`: sum of `(EndTime - StartTime)` for the requesting user's shifts in `currentWeek`
- `days`: 7-element array; for each day, `opacity = min(1.0, 0.35 + dailyHours / 8.0 * 0.65)`
- `avatarInitials`: `(FirstName[0] + LastName[0]).ToUpper()`, split on first space in `DisplayName`
- `iconBg`: read directly from the stored value — client supplies it in `POST /api/schedules` and the backend persists it as-is
- `currentUserRole`: look up `schedule_members.Role` for the authenticated user

### Endpoints implemented
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/schedules` | Bearer |
| POST | `/api/schedules` | Bearer |
| GET | `/api/schedules/{id}` | Bearer |
| POST | `/api/schedules/{id}/rename` | Bearer (Manager only) |

### Tasks

- [x] Create `DTOs/Schedules/ScheduleItemDto.cs` (all list fields from API.md)
- [x] Create `DTOs/Schedules/ScheduleDetailDto.cs` (list fields + employees + shifts + weekStartDate + currentUserRole)
- [x] Create `DTOs/Schedules/EmployeeDto.cs`
- [x] Create `DTOs/Schedules/ShiftDto.cs`
- [x] Create `DTOs/Schedules/CreateScheduleRequest.cs`
- [x] Create `DTOs/Schedules/RenameRequest.cs`
- [x] Create `Services/IScheduleService.cs` (interface)
- [x] Create `Services/ScheduleService.cs`
  - `GetUserSchedulesAsync(userId)` → list of ScheduleItemDto
  - `CreateScheduleAsync(userId, request)` → ScheduleItemDto (creator becomes Manager, invite code generated)
  - `GetScheduleDetailAsync(scheduleId, userId, weekStart?)` → ScheduleDetailDto or null
  - `RenameScheduleAsync(scheduleId, userId, newTitle)` → bool (checks Manager role)
- [x] Create utility `Helpers/InviteCodeGenerator.cs` — generates random 6-char uppercase alphanumeric, retries on collision
- [x] Create utility `Helpers/AvatarHelper.cs` — `GetInitials(displayName)`:
  - Split on first space: `"Alex Rivera"` → `"AR"`
  - Single-word name: `"Alice"` → `"A"`
  - Empty/null: → `"?"`
- [x] `iconBg` is sent by the client in `POST /api/schedules` and stored as-is — no server-side palette logic needed
- [x] Create `Controllers/SchedulesController.cs` (thin — calls service, maps result to IActionResult)
- [x] Register `IScheduleService` as scoped in `Program.cs`
- [x] Authorization guard: `GetScheduleDetailAsync` must verify user is a member of the schedule
- [x] Add `ShiftType` (text, default 'Custom') to `Shift` model + migration `AddShiftType`

### Verification
```bash
dotnet build
# With valid JWT:
# GET  /api/schedules          → 200 [] (empty for new user)
# POST /api/schedules          → 200 with new schedule, inviteCode populated
# GET  /api/schedules/{id}     → 200 with employees=[], shifts=[]
# POST /api/schedules/{id}/rename → 200 { "ok": true }
# GET  /api/schedules/{id} as non-member → 403
```

### Exit criteria
- List returns only schedules the user is a member of
- Create assigns Manager role to creator
- Computed `days` array has exactly 7 elements with correct `isToday` flag
- Rename blocked for non-managers (403)

---

## Step 4 — Schedule Membership & Week Navigation

**Branch:** `feat/backend-step4-membership`
**Depends on:** Step 3
**Parallelizable with:** Step 5

### Context brief
Implements invite code lookup, join, leave, list members, remove member, and "Add Next Week". These are the operations users perform after a schedule exists.

### Endpoints implemented
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/schedules/lookup?code={inviteCode}` | Bearer |
| POST | `/api/schedules/join` | Bearer |
| POST | `/api/schedules/{id}/leave` | Bearer |
| GET | `/api/schedules/{id}/members` | Bearer |
| POST | `/api/schedules/{id}/members/remove` | Bearer (Manager only) |
| POST | `/api/schedules/{id}/weeks` | Bearer (Manager only) |

### Tasks

- [x] Create `DTOs/Schedules/LookupResponse.cs` (scheduleName, managerName, memberCount)
- [x] Create `DTOs/Schedules/JoinRequest.cs` (inviteCode)
- [x] Create `DTOs/Schedules/JoinResponse.cs` (id, title, managerName, memberCount)
- [x] Create `DTOs/Schedules/MemberDto.cs` (id, name, role, avatarInitials, scheduleRole)
- [x] Create `DTOs/Schedules/RemoveMemberRequest.cs` (userId)
- [x] Add to `IScheduleService` + implement in `ScheduleService`:
  - `LookupByCodeAsync(code, userId)` → LookupResponse | 404 | 409-already-member
  - `JoinByCodeAsync(code, userId)` → JoinResponse | 404 | 409
  - `LeaveScheduleAsync(scheduleId, userId)` → bool (blocks if sole manager)
  - `GetMembersAsync(scheduleId, userId)` → IList<MemberDto> (membership check)
  - `RemoveMemberAsync(scheduleId, requesterId, targetUserId)` → bool (Manager only)
  - `AddNextWeekAsync(scheduleId, userId)` → new currentWeek date (Manager only)
- [x] Add routes to `SchedulesController`:
  - Constrain `{id}` to GUID: `[HttpGet("{id:guid}")]` — this prevents `lookup` from being matched as an id
  - `GET /lookup` uses `[HttpGet("lookup")]` (literal segment, resolved before `{id:guid}`)
  - `POST /join` (no {id})
  - `POST /{id}/leave`
  - `GET /{id}/members`
  - `POST /{id}/members/remove`
  - `POST /{id}/weeks`
- [x] AddNextWeek: guard that it is a one-way operation (new currentWeek = currentWeek + 7 days, never go back)
- [x] LeaveSchedule: return 409 if user is sole Manager

### Verification
```bash
# GET  /api/schedules/lookup?code=INVALID  → 404
# GET  /api/schedules/lookup?code=VALID    → 200 preview
# POST /api/schedules/join { inviteCode: VALID } → 200
# POST /api/schedules/join { inviteCode: VALID } (second time) → 409
# GET  /api/schedules/{id}/members → 200 list
# POST /api/schedules/{id}/weeks (as Manager) → 200 { currentWeek: next Monday }
# POST /api/schedules/{id}/weeks (as Member) → 403
```

### Exit criteria
- Routing: `GET /lookup` resolved before `GET /{id}` (no 404/ambiguity)
- Sole-manager leave blocked (409)
- AddNextWeek: currentWeek advances exactly 7 days

---

## Step 5 — Shifts (Add / Update / Delete)

**Branch:** `feat/backend-step5-shifts`
**Depends on:** Step 3
**Parallelizable with:** Step 4

### Context brief
Implements shift CRUD. Authorization rules:
1. Manager — can add/edit/delete any shift in the schedule
2. `full_collaboration` permission — any member can add/edit/delete any shift
3. Any member — can add a shift for themselves, or edit/delete their own existing shift (regardless of schedule permission)

The shift must belong to the `currentWeek` of the schedule (assigned server-side on creation).

### Endpoints implemented
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/schedules/{id}/shifts` | Bearer |
| POST | `/api/shifts/{id}/update` | Bearer |
| POST | `/api/shifts/{id}/delete` | Bearer |

### Tasks

- [x] Create `DTOs/Shifts/AddShiftRequest.cs` (employeeId, dayOfWeek, startTime, endTime, shiftType)
- [x] Create `DTOs/Shifts/UpdateShiftRequest.cs` (startTime, endTime, shiftType)
- [x] Create `Services/IShiftService.cs`
- [x] Create `Services/ShiftService.cs`
  - `AddShiftAsync(scheduleId, requesterId, request)`:
    - Verify requester is a member
    - Authorization: isManager OR isFullCollab OR request.EmployeeId == requesterId (member may only create shifts for themselves)
    - Validate `dayOfWeek` 0–6
    - Validate `startTime < endTime`
    - Shift is created for the `currentWeek` of the schedule
    - Returns ShiftDto
  - `UpdateShiftAsync(shiftId, requesterId, request)`:
    - Load shift → load schedule
    - Authorization: isManager OR isFullCollab OR shift.UserId == requesterId
    - Returns ShiftDto
  - `DeleteShiftAsync(shiftId, requesterId)`:
    - Same authorization as Update
    - Returns bool
- [x] Create `Controllers/ShiftsController.cs` (thin, calls service)
- [x] Register `IShiftService` as scoped in `Program.cs`
- [x] `startTime` / `endTime` stored as `TimeOnly` in EF (maps to `time` in PostgreSQL), serialized as `"HH:mm"` string in DTO
- [x] `WeekStart` on Shift: assigned server-side at creation time from `schedule.CurrentWeek` (not sent by client); this is how shifts are filtered by week in `GET /api/schedules/{id}`

### Verification
```bash
# POST /api/schedules/{id}/shifts (as Manager)  → 200 new shift for anyone
# POST /api/schedules/{id}/shifts (as Member, userId=self) → 200 (allowed)
# POST /api/schedules/{id}/shifts (as Member, userId=other) → 403
# POST /api/shifts/{shiftId}/update (own shift as Member) → 200
# POST /api/shifts/{shiftId}/update (other's shift as Member, manager_only perm) → 403
# POST /api/shifts/{shiftId}/delete → 200 { "ok": true }
```

### Exit criteria
- Authorization matrix matches `docs/frontend-summary.md` Section 6
- `startTime < endTime` enforced

---

## Step 6 — Work Hours & Notifications

**Branch:** `feat/backend-step6-work-hours-notifications`
**Depends on:** Steps 4 & 5

### Context brief
Implements the two remaining data-heavy endpoints: member work hours (4-week history) and notifications (list + mark-read). The mobile client polls notifications every 30 seconds.

**Notification triggers (minimum scope):**

| Event | Who is notified | Type string | Message template |
|-------|----------------|-------------|-----------------|
| Another user modifies a shift you own | Shift owner | `shift_modified` | `"{actorName} updated your shift on {dayName}"` |
| Another user deletes a shift you own | Shift owner | `shift_deleted` | `"{actorName} removed your shift on {dayName}"` |
| Manager calls Add Next Week | All schedule members | `new_week_added` | `"A new week has been added to {scheduleName}"` |
| Manager removes you from a schedule | Removed member | `removed_from_schedule` | `"You have been removed from {scheduleName}"` |

Notifications are **not** created when a user modifies or deletes their own shift (no self-notifications).

### Endpoints implemented
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/schedules/{id}/members/{userId}/work-hours` | Bearer |
| GET | `/api/notifications` | Bearer |
| POST | `/api/notifications/read` | Bearer |

### Tasks

**Work Hours:**
- [x] Create `DTOs/Schedules/WorkHourWeekDto.cs` (weekStart, weekEnd, totalHours)
- [x] Add to `IScheduleService` + implement in `ScheduleService`:
  - `GetMemberWorkHoursAsync(scheduleId, requesterId, targetUserId)`:
    - Verify requester is a member of the schedule (any role — not manager-only)
    - Compute current week and 3 preceding weeks (4 weeks total, newest first)
    - For each week: sum `(EndTime - StartTime)` for all shifts with matching ScheduleId + UserId + WeekStart
    - Return list of WorkHourWeekDto with `weekEnd = weekStart + 6 days`
- [x] Add route to `SchedulesController`

**Notifications:**
- [x] Create `DTOs/Notifications/NotificationDto.cs` (id, type, message, isRead, createdAt)
- [x] Create `DTOs/Notifications/MarkReadRequest.cs` (notificationIds: List<string>)
- [x] Create `Services/INotificationService.cs`
- [x] Create `Services/NotificationService.cs`
  - `GetNotificationsAsync(userId)` → IList<NotificationDto>, ordered by createdAt DESC
  - `MarkReadAsync(userId, notificationIds)` → only marks notifications belonging to userId
  - `NotifyShiftModifiedAsync(shift, actorId)` → inserts `shift_modified` row for shift.UserId, skips if actorId == shift.UserId
  - `NotifyShiftDeletedAsync(shift, actorId)` → inserts `shift_deleted` row for shift.UserId, skips if actorId == shift.UserId
  - `NotifyNewWeekAsync(scheduleId, scheduleName)` → bulk-inserts `new_week_added` rows for all current members
  - `NotifyRemovedFromScheduleAsync(userId, scheduleId, scheduleName)` → inserts `removed_from_schedule` row for the removed user
- [x] `ShiftService` (Step 5) calls `NotifyShiftModifiedAsync` / `NotifyShiftDeletedAsync` — inject `INotificationService` as dependency
- [x] `ScheduleService` (Steps 3–4) calls `NotifyNewWeekAsync` in `AddNextWeekAsync`, and `NotifyRemovedFromScheduleAsync` in `RemoveMemberAsync`
- [x] Create `Controllers/NotificationsController.cs` (thin)
- [x] Register `INotificationService` as scoped in `Program.cs`

### Verification
```bash
# GET /api/schedules/{id}/members/{userId}/work-hours → 200, 4-element array
# GET /api/notifications → 200 [] (empty initially)
# POST /api/notifications/read { notificationIds: ["id1"] } → 200 { "ok": true }
# GET /api/notifications → isRead: true for marked items
```

### Exit criteria
- Work hours: always returns exactly 4 entries (weeks with no shifts return `totalHours: 0`)
- Notifications: mark-read ignores IDs not belonging to the requesting user (no 403, just silently skips)
- Notifications polled at `/api/notifications` returns only the authenticated user's notifications

---

## Cross-Cutting Concerns (apply in every step)

### Error handling
- All controller actions return `{ "error": "<message>" }` with appropriate HTTP status on failure
- Services throw domain-specific exceptions; a global exception middleware (or `ActionFilter`) converts them to the error shape
- 401 for unauthenticated, 403 for unauthorized, 404 for not found, 409 for conflicts, 400 for validation errors

### Input validation
- All request DTOs use `[Required]`, `[MaxLength]`, and enum validation attributes
- Invalid DTO → 400 with validation error messages (ASP.NET default — use `[ApiController]` attribute for automatic binding)

### No raw entities to clients
- Never return EF entity objects from controllers — always map to DTOs

### Async everywhere
- All database calls are `await`ed; no `.Result` or `.Wait()`

---

## Rollback Strategy

Each step is a self-contained PR. To roll back:
1. Revert the PR branch
2. Run `dotnet ef migrations remove` to undo any new migrations
3. Re-apply previous migration with `dotnet ef database update <PreviousMigrationName>`

---

## Open Questions (consult Allen before implementing)

1. **Refresh token storage:** Store in `AspNetUsers` as extra columns, or a separate `refresh_tokens` table? A table supports multiple devices; extra columns is simpler for MVP.
