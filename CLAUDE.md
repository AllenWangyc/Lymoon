# Lymoon - Project Guide

## Special Restrictions

- Each reply must begin by mentioning my name, Allen.
- When encountering uncertain code design issues, you must consult me first and must not execute directly.
- Do not write compatibility code unless I request it.

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
> **REQUIRED:** After completing any frontend task, summarize lessons learned (patterns used, pitfalls avoided, decisions made) and append them to the relevant section in `docs/frontend.md` to reduce cost and time on similar future tasks.

Tech stack: Expo SDK 52 + Expo Router v3, NativeWind v4, TanStack Query v5, Zustand, date-fns.

Key rules:
- Use NativeWind for all styling — no inline `StyleSheet` objects
- Shared components → `src/components/`, feature components → `src/features/<feature>/components/`
- State (Zustand) in `src/stores/`, hooks in `src/hooks/`, types in `src/types/`

---

## Backend (Lymoon.API)

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
  Services/                     # All business logic
  Data/
    AppDbContext.cs
    Migrations/
  Models/                       # EF Core entities
  DTOs/                         # Request/response models
  Program.cs
```

### Key Conventions
- Controllers are thin: validate input, call service, return result
- All business logic in Services layer
- Use `[Authorize]` on all endpoints except Auth
- Check team membership in services before any data access
- Use async/await throughout; no synchronous DB calls
- DTOs are separate from entity models — never return raw EF entities

### Authorization Rules
- **Manager**: can create and modify all shifts within their team's schedules
- **Member**: can only modify their own shifts (`shift.EmployeeId == currentUserId`)
- Verify team membership via `team_members` table in every service method

### Dev Commands
```bash
cd Lymoon.API
dotnet run
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

---

## Database

### Core Tables
```
AspNetUsers    - Managed by ASP.NET Core Identity
teams          - id, name, invite_code, created_by
team_members   - team_id, user_id, role (Manager | Member)
schedules      - id, team_id, week_start, published_at (null = draft)
shifts         - id, schedule_id, employee_id, day_of_week, start_time, end_time
notifications  - id, user_id, team_id, type, message, is_read, created_at
```

Always use EF Core Code First migrations. Never modify the database schema directly.

---

## Notifications

In-app only — no push notifications.
- On schedule publish: backend bulk-inserts notification rows for all team members
- Mark read via `PATCH /api/notifications/read`

## Invite System

- Teams have a unique 6-character alphanumeric `invite_code`
- Employees enter the code manually in the app to join a team
- No deep links

---

## When Implementing Features

1. Always follow the repository structure defined above
2. Never add new frameworks without justification
3. Keep controllers thin; all logic in Services
4. Use DTOs for API responses — never expose EF entities
5. Follow mobile conventions in [docs/frontend.md](docs/frontend.md)
8. Prefer simple implementations suitable for MVP
