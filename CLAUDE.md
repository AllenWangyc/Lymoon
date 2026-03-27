# Lymoon - Project Guide

## Special Restrictions

- Each reply must begin by mentioning my name, Allen.
- When encountering uncertain code design issues, you must consult me first and must not execute directly.
- Do not write compatibility code unless I request it.
- Whenever implementing a frontend feature that requires a backend API, you MUST add the corresponding endpoint design to `docs/API.md` as part of the same task. Do not leave API documentation as a follow-up.

## Overview

Lymoon is a SaaS shift scheduling mobile app for small businesses (restaurants, cafes, retail).
Multi-tenant: any team can register and use independently.

## Architecture

Traditional client-server architecture:
- **Mobile**: Expo (React Native) + TypeScript
- **Backend**: ASP.NET Core Web API (.NET 8)
- **Database**: PostgreSQL (Neon.tech)
- **Auth**: ASP.NET Core Identity + JWT Bearer

All business logic lives in the .NET backend. The mobile client only communicates through REST APIs. Do not use Supabase Auth, Realtime, or Edge Functions.

## Repository Structure

```
Lymoon/
  lymoon-mobile/        # Expo React Native app
  Lymoon.API/           # ASP.NET Core Web API
  CLAUDE.md
```

---

## Mobile (lymoon-mobile)

> Full details: [docs/frontend.md](docs/frontend.md)
> **REQUIRED:** Before doing any frontend work, you MUST read `docs/frontend.md` in full.

> **REQUIRED:** After completing a frontend task, update `docs/frontend.md` ONLY with high-level, reusable knowledge that improves future development efficiency.

### What to include (STRICT)
- Reusable UI/UX patterns (e.g. bottom sheet usage, navigation patterns)
- Architecture decisions and their rationale
- Generalizable best practices that apply across multiple features

### What to EXCLUDE (IMPORTANT)
- One-off fixes, hacks, or timing workarounds (e.g. setTimeout delays)
- Component-specific implementation details
- Debug notes or temporary solutions

### Writing guideline
- Focus on **"pattern over implementation"**
- Each entry should answer: "Will this be reused across the app?"
- Keep entries concise and structured

Tech stack: Expo SDK 52 + Expo Router v3, NativeWind v4, TanStack Query v5, Zustand, date-fns.

Key rules:
- Use NativeWind (`className`) for ALL styling by default — no inline `StyleSheet` objects
- Inline `style={}` is ONLY permitted when NativeWind cannot express the value:
  - Shadow properties: `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`
  - Text typography: `fontSize`, `fontWeight`, `color`, `lineHeight`, `letterSpacing`
  - Dynamic/computed values: colors from props or state, animated transforms, safe area insets
  - Anything else that Tailwind has no equivalent for in React Native
- Shared components → `src/components/`, feature components → `src/features/<feature>/components/`
- State (Zustand) in `src/stores/`, hooks in `src/hooks/`, types in `src/types/`

---

## Backend (Lymoon.API)

> Full implementation plan: [docs/backend-implementation.md](docs/backend-implementation.md)
> **REQUIRED:** Before doing any backend work, you MUST read `docs/backend-implementation.md` in full.

### Tech Stack
- ASP.NET Core Web API (.NET 8)
- ASP.NET Core Identity (user management)
- JWT Bearer authentication
- Entity Framework Core + Npgsql (PostgreSQL)

### Directory Structure
```
Lymoon.API/
  Controllers/
    HealthController.cs
  Services/                     # All business logic (interfaces + implementations)
  Data/
    AppDbContext.cs
    Migrations/
  Models/                       # EF Core entities + JwtSettings
  DTOs/
    Auth/
    Schedules/
    Shifts/
    Notifications/
  Helpers/                      # InviteCodeGenerator, AvatarHelper
  Program.cs
```

### Key Conventions
- Controllers are thin: validate input, call service, return result
- All business logic in Services layer
- Use `[Authorize]` on all endpoints except Auth
- Every service method that accesses schedule data must first verify the requesting user is a member of that schedule (via `schedule_members`)
- Use async/await throughout; no synchronous DB calls
- DTOs are separate from entity models — never return raw EF entities
- All errors return `{ "error": "<message>" }` with appropriate HTTP status
- Use a global exception middleware or ActionFilter to convert domain exceptions to error responses

### Authorization Rules
- **Manager**: can add/edit/delete any shift in the schedule
- **`full_collaboration` permission**: any member can add/edit/delete any shift
- **Member (default)**: can add a shift only for themselves; can edit/delete only their own shifts
- Check `schedule_members.Role` for the requesting user in every service method

### Dev Commands
```bash
cd Lymoon.API
dotnet run
dotnet ef migrations add <MigrationName>
dotnet ef database update
dotnet ef migrations list
```

---

## Implementation Steps

Work through these steps sequentially (Steps 4 and 5 can run in parallel after Step 3):

- [x] **Step 1** — Database Foundation & Program.cs wiring (`feat/backend-step1-foundation`)
- [x] **Step 2** — Authentication: Register / Login / Refresh (`feat/backend-step2-auth`)
- [ ] **Step 2b** — Third-Party Auth: Google & Apple Sign In (`feat/backend-step2b-oauth`) ← parallel with Step 3
- [x] **Step 3** — Schedules Core: List / Create / Get Detail / Rename (`feat/backend-step3-schedules-core`)
- [x] **Step 4** — Schedule Membership & Week Navigation (`feat/backend-step4-membership`) ← parallel with Step 5
- [x] **Step 5** — Shifts: Add / Update / Delete (`feat/backend-step5-shifts`) ← parallel with Step 4
- [x] **Step 6** — Work Hours & Notifications (`feat/backend-step6-work-hours-notifications`)

Full task checklists, exit criteria, and verification commands for each step are in `docs/backend-implementation.md`.

---

## Database

### Schema
```
AspNetUsers     - ASP.NET Core Identity; + DisplayName (text, not-null)

schedules       - id (uuid), title, description, scheduleType, memberPermission,
                  inviteCode (char 6, unique), iconBg, startWeek (date),
                  currentWeek (date), createdById (FK → AspNetUsers)

schedule_members - scheduleId (FK), userId (FK), role ('Manager' | 'Member')
                   PK: (scheduleId, userId)

shifts          - id (uuid), scheduleId (FK), userId (FK), weekStart (date),
                  dayOfWeek (int, 0=Mon…6=Sun), startTime (time), endTime (time)

notifications   - id (uuid), userId (FK), scheduleId (FK), type, message,
                  isRead (bool, default false), createdAt (timestamptz)
```

> **Note:** There is no separate `teams` table. `Schedule` is the top-level multi-tenant entity. `schedule_members` replaces the old `team_members` concept.

Always use EF Core Code First migrations. Never modify the database schema directly.

---

## Notifications

In-app only — no push notifications. Triggered by:

| Event | Who is notified | Type |
|---|---|---|
| Another user modifies your shift | Shift owner | `shift_modified` |
| Another user deletes your shift | Shift owner | `shift_deleted` |
| Manager adds next week | All schedule members | `new_week_added` |
| Manager removes you from a schedule | Removed member | `removed_from_schedule` |

No self-notifications (actor == target → skip). Mark read via `POST /api/notifications/read`.

## Invite System

- Schedules have a unique 6-character uppercase alphanumeric `inviteCode`
- Generated server-side on schedule creation; retries on collision
- Employees enter the code manually in the app to join a schedule
- No deep links

---

## When Implementing Features

1. Always follow the repository structure defined above
2. Never add new frameworks without justification
3. Keep controllers thin; all logic in Services
4. Use DTOs for API responses — never expose EF entities
5. Follow mobile conventions in [docs/frontend.md](docs/frontend.md)
8. Prefer simple implementations suitable for MVP
