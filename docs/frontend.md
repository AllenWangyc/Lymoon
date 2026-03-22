# Lymoon Mobile — Frontend Guide

## Tech Stack
- Expo SDK 52 + Expo Router v3 (file-based routing)
- NativeWind v4 (Tailwind CSS for React Native)
- TanStack Query v5 (server state)
- Zustand (client state: JWT token, user info, current team)
- date-fns (date/time utilities)
- Package manager: npm

## API Integration Convention

When designing a screen or feature that will eventually need backend data, record the required API call in [`docs/API.md`](./API.md) before or alongside the frontend implementation. This keeps the API contract up to date as the UI evolves.

- If a new endpoint is needed, add it to `docs/API.md` with its method, path, request body, and expected response shape.
- Mark the corresponding frontend code with a `// TODO: replace with <hookName> TanStack Query hook` comment so the integration point is easy to find later.

## Key Conventions
- Use NativeWind classes for all styling — no inline `StyleSheet` objects
- State lives in `src/stores/` (Zustand) — currently `scheduleStore.ts`
- Shared components go in `src/components/`
- Feature-specific components go in `src/features/<feature>/components/`
- Types go in `src/types/`
- Custom hooks go in `src/hooks/`
- Toast notifications use `src/providers/ToastProvider.tsx` + `src/hooks/useToast.ts`
- Navigation uses a custom tab bar: `src/components/CustomTabBar.tsx`
- Shared page headers use `src/components/PageHeader.tsx`


## Dev Commands
```bash
cd lymoon-mobile
npx expo start            # Start dev server
npx expo start --ios      # iOS simulator
npx expo start --android  # Android emulator
```

## Directory Structure
```
lymoon-mobile/
  app/
    _layout.tsx                        # Root layout
    join-schedule.tsx                  # Join via invite code
    (auth)/
      _layout.tsx
      login.tsx
    (app)/
      _layout.tsx                      # Bottom tab navigation (CustomTabBar)
      index.tsx                        # Home: current user's shifts this week
      calendar.tsx                     # Calendar view
      settings.tsx                     # User settings
      create-schedule.tsx              # Create a new schedule (Manager)
      schedule-created.tsx             # Post-creation confirmation + invite code
      schedule/
        _layout.tsx
        [id].tsx                       # Full weekly schedule view
        edit-shift.tsx                 # Edit a single shift
      team/
        _layout.tsx
        index.tsx                      # Team management (Manager only)
  src/
    components/                        # Shared UI components
      CustomTabBar.tsx                 # Custom bottom tab bar
      PageHeader.tsx                   # Shared page header
      HomeHeader.tsx
      NewScheduleBottomSheet.tsx
      WeekPickerBottomSheet.tsx
      OTPInput.tsx
      CodeInputHint.tsx
      Toast.tsx
    hooks/
      useToast.ts
    providers/
      ToastProvider.tsx
    stores/
      scheduleStore.ts                 # Zustand: schedule state
    types/
      schedule.ts
    features/
      schedule/
        constants.ts
        components/
          ScheduleCard.tsx             # Home screen schedule card
          SchedulePreviewCard.tsx
          ScheduleOptionsMenu.tsx
          WeekNavigator.tsx
          WeekBar.tsx
          DaySelector.tsx
          EmployeeShiftRow.tsx
          ShiftCard.tsx
          ShiftDetailBottomSheet.tsx
          AddShiftSlot.tsx
          CategoryPicker.tsx           # Schedule category picker
          PermissionPicker.tsx         # Member permission picker
          LeaveScheduleSheet.tsx       # Confirmation sheet for leaving a schedule
          AddEditShiftBottomSheet.tsx  # Add or edit a shift
```
