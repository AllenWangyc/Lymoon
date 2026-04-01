# Redesign Notifications Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Notifications page to a light-theme, card-based layout with time grouping, per-type icons, unread/read visual states, a page header with back button, and a "Clear All" (= mark all read) button. Page is full-screen (no bottom tab bar).

**Architecture:** Single-file redesign of `app/(app)/notifications/index.tsx`. Reuses `PageHeader`, `useNotifications`, `useMarkNotificationsRead`. No new backend endpoints or query hooks required.

**Tech Stack:** Expo Router v3, NativeWind v4, TanStack Query v5, Ionicons, date-fns

---

## File Map

| File | Change |
|---|---|
| `app/(app)/notifications/index.tsx` | Full redesign |

**Read-only references:**
- `src/components/PageHeader.tsx` — reuse as-is, pass `rightElement` for Clear All button
- `src/lib/queries/notifications.ts` — `useNotifications`, `useMarkNotificationsRead` (no changes)

---

## Task 1: Build time-grouping utility

**File:** `app/(app)/notifications/index.tsx` (inline helper)

- [x] Import `isToday`, `isYesterday`, `differenceInCalendarDays` from `date-fns`
- [x] Write pure function `groupNotificationsByPeriod(notifications: Notification[])` that returns `Array<{ title: string; data: Notification[] }>` with sections:
  - `TODAY` — `isToday(createdAt)`
  - `YESTERDAY` — `isYesterday(createdAt)`
  - `THIS WEEK` — 2–6 days ago (`differenceInCalendarDays` in [2, 6])
  - `EARLIER` — 7+ days ago
- [x] Filter out empty sections

**Exit criteria:** Given a mixed array of notifications spanning multiple days, the function returns only non-empty sections in the correct order.

---

## Task 2: Build `NotificationCard` component

**File:** `app/(app)/notifications/index.tsx` (inline component)

### Per-type icon mapping (Ionicons, size 22)
| Type | Icon name |
|---|---|
| `shift_modified` | `create-outline` |
| `shift_deleted` | `trash-outline` |
| `new_week_added` | `calendar-outline` |
| `removed_from_schedule` | `person-remove-outline` |
| `shift_added` | `add-circle-outline` |
| `member_joined` | `person-add-outline` |
| `schedule_updated` | `refresh-outline` |

### Card layout (flex-row, padding 16, gap 14)

**Icon container (48×48, rounded-12):**
- Unread: background `rgba(182,236,19,0.2)`, icon color `#4e6704`
- Read: background `#f1f5f9`, icon color `#94a3b8`

**Unread dot:** 10px circle, `#b6ec13`, absolute top-right of icon container (`top: -2, right: -2`)

**Content column:**
- Row 1: type label (SemiBold 13px, `#64748b` unread / `#94a3b8` read) + timestamp (12px `#94a3b8`, right-aligned)
- Row 2: message text (14px, lineHeight 20, `#0f172a` unread / `#64748b` read)

**Card wrapper:**
- Unread: `bg-white`, shadow (`shadowColor #000, offset 0/1, opacity 0.05, radius 2, elevation 1`), border-radius 14, `mb-3`
- Read: background `rgba(255,255,255,0.6)`, no shadow, border-radius 14, `mb-3`

- [x] Implement `NotificationCard` component per spec above
- [x] Use `formatDistanceToNow` (existing helper) for timestamp
- [x] Use existing `TYPE_LABELS` constant for type label text

**Exit criteria:** Unread card renders with brand-tinted icon container and green dot; read card renders with grey icon container and no dot.

---

## Task 3: Build section header component

**File:** `app/(app)/notifications/index.tsx` (inline component)

- [x] Implement `SectionHeader({ title }: { title: string })`:
  ```tsx
  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2 }}
        className="mt-5 mb-2 px-1">
    {title}
  </Text>
  ```

**Exit criteria:** Section headers render as small all-caps grey labels above their card groups.

---

## Task 4: Build `NotificationsScreen` with SectionList and header

**File:** `app/(app)/notifications/index.tsx`

### Header
- [x] Import `useRouter` from `expo-router`
- [x] Import `PageHeader` from `@/components/PageHeader`
- [x] Wrap header in `View` with `paddingTop: insets.top + 12`, `px-4 pb-3`, `bg-[#f8f8f6]`
- [x] Pass to `PageHeader`:
  - `title="Notifications"`
  - `onBack={() => router.back()}`
  - `rightElement`: TouchableOpacity "Clear All" button, color `#b6ec13` when `unreadCount > 0`, else `#94a3b8`; disabled when `markRead.isPending`

### Clear All handler
- [x] Implement `handleClearAll`: calls `markRead.mutate(notifications.map(n => n.id))` with error toast on failure

### SectionList
- [x] `sections` = `groupNotificationsByPeriod(notifications)`
- [x] `renderItem` = `<NotificationCard item={item} />`
- [x] `renderSectionHeader` = `<SectionHeader title={section.title} />`
- [x] `stickySectionHeadersEnabled={false}`
- [x] `contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}`
- [x] `keyExtractor={(item) => item.id}`
- [x] Add `RefreshControl` with `tintColor="#b6ec13"`

### Page background
- [x] Outer `View className="flex-1 bg-[#f8f8f6]"`

### Loading / Error / Empty states
- [x] **Loading:** `ActivityIndicator` centered, `color="#b6ec13"`
- [x] **Error:** Centered error text + pull-to-refresh hint
- [x] **Empty:** Centered `Ionicons notifications-off-outline` (size 48, color `#94a3b8`) + "You're all caught up" text (16px, `#94a3b8`)

**Exit criteria:**
- Page background is `#f8f8f6`
- `PageHeader` renders with back button, "Notifications" title, "Clear All" right button
- Tapping "Clear All" marks all notifications as read (unread dots disappear)
- Notifications grouped by time period with section headers
- No bottom tab bar visible (already handled by `CustomTabBar`)
- Pull to refresh works

---

## Verification

```bash
cd lymoon-mobile
npx expo start
```

1. Open Notifications from home screen bell icon
2. Confirm light background, back button, "Clear All" button
3. Confirm time section headers (TODAY / YESTERDAY / etc.)
4. Confirm unread cards show green icon bg + green dot; read cards show grey icon bg + no dot
5. Tap "Clear All" → all unread dots disappear, button dims to grey
6. Pull down to refresh
7. Navigate away and back — back button works
8. If no notifications: "You're all caught up" empty state visible
9. No bottom tab bar visible on this screen
