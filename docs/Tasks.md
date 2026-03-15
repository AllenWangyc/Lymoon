Set up the initial project skeleton for the Lymoon project.
Work in small, controlled steps. Do not expand scope beyond the tasks listed.
Do not implement business features yet.

Project context:
- Lymoon is a multi-tenant shift scheduling mobile app for small businesses.
- The architecture is a traditional client-server architecture.
- Mobile: Expo (React Native) + TypeScript
- Backend: ASP.NET Core Web API (.NET 8)
- Database: PostgreSQL
- Auth: ASP.NET Core Identity + JWT Bearer
- All business logic must live in the .NET backend.
- The mobile client must communicate only through REST APIs.
- Do not use Supabase Auth, Realtime, or Edge Functions.


Important constraints:
- Do not implement business features yet.
- Do not create auth logic yet.
- Do not create team, schedule, shift, or notification feature logic yet.
- Do not generate database entities or EF Core migrations yet.
- Do not build full UI screens yet.
- Focus only on clean project initialization and repository structure.

Tasks:

1. Create a clean root project structure for Lymoon.

Expected structure:
- CLAUDE.md
- docs/
- lymoon-mobile/
- Lymoon.API/

2. Initialize `lymoon-mobile` as an Expo + TypeScript project.

Mobile requirements:
- Use Expo with TypeScript
- Set up Expo Router
- Install the core libraries already defined in the project guide:
  - @tanstack/react-query
  - zustand
  - date-fns
  - nativewind
- Create only the minimal routing structure needed for future work:
  - app/
    - _layout.tsx
    - (auth)/
    - (app)/
- Do not implement real screens yet
- Placeholder screens are acceptable
- Keep the mobile setup minimal and runnable

3. Initialize `Lymoon.API` as an ASP.NET Core Web API project.

Backend requirements:
- Use .NET 8 Web API
- Create the following base folders:
  - Controllers/
  - Services/
  - Data/
  - Models/
  - DTOs/
- Add package references needed for the planned architecture, but do not implement features yet:
  - Entity Framework Core
  - Npgsql provider
  - ASP.NET Core Identity
  - JWT Bearer authentication
- Keep Program.cs minimal
- Do not create real controllers except a simple health check endpoint if needed
- Do not implement auth, teams, schedules, shifts, or notifications yet

4. Add a simple README.md at the project root.

README should include:
- what the project is
- project structure
- how to start the mobile app
- how to start the backend API

5. Keep everything minimal, clean, and ready for iterative development.

Definition of done:
- The repository structure exists
- The Expo app can start
- The .NET API can run
- The project is ready for the next step
- No business feature implementation has started yet

If any implementation detail is not yet defined, choose the simplest option that preserves future flexibility.
