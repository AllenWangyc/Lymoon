# ADR-0021: Notifications accessed via home screen header bell icon, not a dedicated tab

**Date**: 2026-03-30
**Status**: accepted
**Deciders**: Allen

## Context

The notification center screen (`app/(app)/notifications/index.tsx`) was built and wired to the live API (ADR-0019) but had no navigation entry point — it was neither registered in `_layout.tsx` nor reachable from any other screen. Making it accessible required choosing where in the UI the entry point should live.

The existing tab bar (`CustomTabBar`) has a fixed symmetric layout: two tabs on the left (Home, Calendar), a center FAB for creating schedules, and two tabs on the right (Teams, Settings). Adding a sixth element would break the 2+FAB+2 symmetry and require a layout redesign.

## Decision

The notification center is accessed via a bell icon (`Ionicons: notifications-outline / notifications`) placed in the top-right of the home screen header (`src/components/HomeHeader.tsx`). The bell icon shows a small green (`#b6ec13`) badge dot when there are unread notifications. Tapping it calls `router.push('/notifications')`.

The `notifications` route is registered as a `<Tabs.Screen>` in `_layout.tsx` and added to `CustomTabBar`'s exclusion guard so the tab bar hides when the screen is active — consistent with the existing pattern for `schedule`, `create-schedule`, and `schedule-created`.

## Alternatives Considered

### Alternative 1: Add notifications as a 5th tab in CustomTabBar
- **Pros**: Notifications always visible and one tap away from any screen
- **Cons**: Breaks the 2+FAB+2 symmetric tab bar layout; would require redesigning `CustomTabBar` to handle 5 items; the notification tab is less frequently needed than Home, Calendar, Teams, or Settings
- **Why not**: Layout disruption is not justified for an MVP feature used less often than the core tabs. The bell icon in the home header serves the same purpose without structural change.

### Alternative 2: Notifications accessible from a settings or team screen
- **Pros**: No home screen header change needed
- **Cons**: Non-obvious placement; users expect notifications to be near the top-level of navigation
- **Why not**: The home screen header is the standard mobile placement for notification access.

### Alternative 3: Keep notifications unreachable until tab bar is redesigned
- **Pros**: Defers the layout decision
- **Cons**: The screen was complete and API-wired but completely inaccessible — a regression from any prior state where the screen existed
- **Why not**: A finished screen with no entry point is worse than a pragmatic navigation choice.

## Consequences

### Positive
- Notifications are accessible without redesigning the tab bar
- Unread badge on the bell icon gives users a visual cue without leaving the home screen
- The notifications screen uses the same hide-tab-bar pattern as other detail screens — visually consistent

### Negative
- The bell icon is only present on the home screen header; from other tabs (Calendar, Teams, Settings) there is no direct access to notifications
- The home screen header takes on dual responsibility: it is both a schedule-list header and a global notification entry point

### Risks
- If the tab bar is redesigned in the future to accommodate more items, the bell icon in the header may become redundant with a proper notifications tab. When that happens, remove the header bell and badge.
