# Lymoon Mobile — Frontend Guide

## Tech Stack
- Expo SDK 52 + Expo Router v3 (file-based routing)
- NativeWind v4 (Tailwind CSS for React Native)
- TanStack Query v5 (server state)
- Zustand (client state: JWT token, user info, current team)
- date-fns (date/time utilities)
- Package manager: npm

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

## Toast System

`ToastProvider` is mounted at the root layout and **persists across screen navigation**. Toast shown before `router.back()` will still be visible on the destination screen.

```typescript
const { showToast } = useToast();
showToast('Message here');                        // success, 3 s
showToast('Something went wrong', 'error');       // error type
showToast('Done', 'success', 5000);               // custom duration (ms)
```

> Do NOT call `showToast` via `pendingToast` in the Zustand store unless the toast must survive a full app reload. Direct `showToast` is the standard path.

## BottomSheet

`src/components/BottomSheet.tsx` — base component. `height` (number, px) is **required**. Visibility is always owned by the parent via `useState`.

```typescript
const [visible, setVisible] = useState(false);

<BottomSheet visible={visible} onClose={() => setVisible(false)} height={300}>
  {/* content */}
</BottomSheet>
```

Optional props: `backgroundColor` (default `#f8f8f6`), `backdropOpacity` (default `0.6`), `openAnimation` (`{ type: 'timing' | 'spring', ... }`).

Use `backgroundColor="#ffffff"` when the sheet content is pure white (e.g. member list cards). The default `#f8f8f6` is for sheets with a light off-white background.

When a sheet contains a scrollable list, wrap content in `ScrollView` with `contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 12 }}` and pass a fixed `height` to `BottomSheet` large enough to show ~4 items (480px works well for member lists).

When triggering a sheet from a menu (e.g. `ScheduleOptionsMenu`), use `setTimeout(() => setVisible(true), 160)` to let the menu close animation finish before the sheet opens — same pattern as `onLeave`.

Shadow properties (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`) cannot be expressed in NativeWind and must use inline `style={{}}` props. This is the accepted exception to the "no inline styles" rule.

## scheduleStore Actions

`src/stores/scheduleStore.ts` — current public API:

| Action | Signature | Effect |
|--------|-----------|--------|
| `addSchedule` | `(item: ScheduleItem, toastMessage?: string)` | Appends to list, sets `pendingToast` |
| `removeSchedule` | `(scheduleId: string, toastMessage?: string)` | Filters item out of list, sets `pendingToast` |
| `clearPendingToast` | `()` | Clears `pendingToast` |
| `setShowNewScheduleSheet` | `(visible: boolean)` | Controls new-schedule sheet visibility |

## ScheduleOptionsMenu

`src/features/schedule/components/ScheduleOptionsMenu.tsx` — dropdown menu rendered via `Modal`, anchored top-right. Props:

```typescript
{ visible: boolean; onClose: () => void; onLeave: () => void }
```

When adding new menu item callbacks, add them to `Props` and thread through from the parent screen (`[id].tsx`).

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
