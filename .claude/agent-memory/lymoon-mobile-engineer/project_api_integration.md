---
name: Frontend API integration task status
description: Tracks what has been built for the frontend-backend API integration plan
type: project
---

`src/lib/api.ts` was created as the central fetch wrapper for all API calls. It exports `apiGet`, `apiPost`, `apiPatch`, `apiDelete` — all route through `fetchWithAuth` which attaches the JWT `Authorization` header and handles 401 → token refresh → retry automatically. `tryRefresh` calls `POST /api/auth/refresh` and on failure calls `clearUser()` to reset auth state.

**Why:** All TanStack Query hooks must go through this wrapper rather than raw `fetch`, per project convention.

**How to apply:** Every new query hook in `src/lib/queries/` must import and use `apiGet`/`apiPost`/`apiPatch`/`apiDelete` from `@/lib/api` — never call `fetch` directly.

`src/stores/authStore.ts` was rewritten from a mock-seeded stub to the full production shape with nullable fields and three actions: `setUser`, `setTokens`, `clearUser`. The old store had hardcoded mock user data (`userId: 'emp-1'`, `userName: 'Alex Rivera'`) with no token fields and no actions at all.

Consuming call sites (`HomeHeader.tsx`, `schedule/[id].tsx`) use non-null assertions (`!`) when reading fields that are guaranteed non-null post-login — this is the established pattern for authenticated-only screens.

`src/lib/queries/schedules.ts` was created with the full suite of schedule query hooks: `useSchedules`, `useCreateSchedule`, `useScheduleDetail`, `useAddNextWeek`, `useRenameSchedule`, `useLeaveSchedule`, `useScheduleLookup`, `useJoinSchedule`, `useScheduleMembers`, `useWorkHours`, `useRemoveMember`. The `toScheduleItem` transform function computes `subtitle` locally from `scheduleType` and `currentWeek` (not returned by the API). `scheduleKeys` is the centralized query key factory for cache invalidation. `useScheduleDetail` accepts an optional `weekStart` param that is appended as a query string to support week navigation.

`src/lib/queries/notifications.ts` was created with `useNotifications` (polls `GET /api/notifications` every 30 seconds via `refetchInterval: 30_000`) and `useMarkNotificationsRead` (posts `{ notificationIds: string[] }` to `POST /api/notifications/read`, then invalidates the notifications query). `notificationKeys.all` is the query key. The `Notification` interface shape: `{ id, type, message, isRead, createdAt }`.

**Task 12 complete:** `app/(app)/schedule/[id].tsx` was rewritten to replace all `useScheduleStore` reads (scheduleItem, employees, shifts) with `useScheduleDetail`. `currentUserRole` is now read from the API response (schedule-scoped), not from `authStore.userRole`. `useRenameSchedule`, `useLeaveSchedule`, and `useAddNextWeek` are wired. `handleAddNextWeek` advances `weekOffset` on mutation success. `handleShiftConfirm` and `handleDeleteShift` are left with `// TODO: wire to shifts.ts mutations (Task 14)` comments. Loading and error states (with retry) are rendered before the main view. `scheduleStore` shift/employee/scheduleItem reads have been fully removed from this screen.

`app/(app)/notifications/index.tsx` was created from scratch (the file did not previously exist). It renders a `FlatList` of notifications with unread dot indicators, relative timestamps via `date-fns formatDistanceToNow`, a type label map for `shift_modified` / `shift_deleted` / `new_week_added` / `removed_from_schedule`, a "Mark all read" button (header, only shown when unread > 0), `ActivityIndicator` loading state, and a centered empty state. The notifications route is NOT yet registered in `app/(app)/_layout.tsx` — that tab is absent from the `Tabs.Screen` list and may need to be added if navigating to this screen via the tab bar.

**Task 15 complete:** `ViewMembersSheet` was refactored to own its own data — the `employees` and `onRemoveMember` props were replaced with `scheduleId` and `onRemoveSuccess`. The component now calls `useScheduleMembers(scheduleId)` for the list, `useWorkHours(scheduleId, employee.id)` inside `WorkHoursView` (with a loading state), and `useRemoveMember(scheduleId)` for the remove action. The `MOCK_WORK_HOURS_HISTORY` import from `constants.ts` was removed entirely. `WorkHoursView` maps API `{ weekStart, totalHours }` entries onto the four locally-computed week ranges via `wh.weekStart.startsWith(isoStart)`. `OptionsMenuCard` was extended: `OptionsMenuItem` gained an optional `disabled?: boolean` field, and the destructive item render applies `disabled` + `opacity: 0.4` when pending. `[id].tsx` now passes `scheduleId` to `ViewMembersSheet` and handles `onRemoveSuccess` with a success toast.
