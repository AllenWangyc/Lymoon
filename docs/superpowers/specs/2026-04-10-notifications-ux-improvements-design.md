# Notifications UX Improvements

**Date:** 2026-04-10  
**Status:** Approved

## Overview

Two targeted UX improvements to the Notifications page:

1. **"Clear All" deletes all notifications** (previously only marked unread as read)
2. **Tapping an unread notification card marks it as read**

---

## Backend

### New service method

Add to `INotificationService`:

```csharp
Task DeleteAllAsync(string userId);
```

`NotificationService` implementation deletes all notification rows for the given user from the database.

### New endpoint

```
DELETE /api/notifications
```

- Requires `[Authorize]`
- Extracts `userId` from claims
- Calls `DeleteAllAsync(userId)`
- Returns `204 No Content`

---

## Frontend — Mutations (`src/lib/queries/notifications.ts`)

### New: `useDeleteAllNotifications`

```ts
export function useDeleteAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete<void>('/notifications'),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const previous = qc.getQueryData<Notification[]>(notificationKeys.all);
      qc.setQueryData<Notification[]>(notificationKeys.all, []);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(notificationKeys.all, context.previous);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
```

Optimistically clears the cache; rolls back on error.

### Prerequisite: `apiDelete` in `lib/api.ts`

Confirm `apiDelete` helper exists; add if missing. Signature: `apiDelete<T>(path: string): Promise<T>`.

---

## Frontend — UI (`app/(app)/notifications/index.tsx`)

### "Clear All" button

- Replace `useMarkNotificationsRead` with `useDeleteAllNotifications` for this action
- Guard: disabled when `notifications.length === 0` (previously `unreadCount === 0`)
- Color: active (lime) when any notifications exist; grey when empty or pending
- On success: show toast "All notifications cleared"

```ts
const deleteAll = useDeleteAllNotifications();

function handleClearAll() {
  if (notifications.length === 0) return;
  deleteAll.mutate(undefined, {
    onSuccess: () => showToast('All notifications cleared'),
    onError: () => showToast('Failed to clear notifications'),
  });
}
```

### `NotificationCard` — tap to mark read

- Add `onPress: () => void` prop
- Use `Pressable` (replaces `TouchableOpacity`) — its `pressed` state drives a scale transform
- Unread cards: scale to `0.97` on press, back to `1` on release (spring feel via native driver)
- Already-read cards: no visual feedback, `onPress` not attached
- `onPress` only fires when `!item.isRead`

```tsx
function NotificationCard({ item, onPress }: { item: Notification; onPress: () => void }) {
  return (
    <Pressable
      onPress={!item.isRead ? onPress : undefined}
      style={({ pressed }) => ({
        transform: [{ scale: !item.isRead && pressed ? 0.97 : 1 }],
      })}
    >
      {/* existing card content unchanged */}
    </Pressable>
  );
}
```

In the list render:

```tsx
renderItem={({ item }) => (
  <NotificationCard
    item={item}
    onPress={() => markRead.mutate([item.id], {
      onError: () => showToast('Failed to mark as read'),
    })}
  />
)}
```

`useMarkNotificationsRead` is retained for the per-card tap interaction.

---

## Error Handling

| Action | Success behaviour | Error behaviour |
|--------|------------------|----------------|
| Clear All succeeds | Toast: "All notifications cleared" | — |
| Clear All fails | Optimistic update rolled back | Toast: "Failed to clear notifications" |
| Tap to mark read fails | — | Optimistic update rolled back; toast: "Failed to mark as read" |

---

## Out of Scope

- Per-card delete (swipe-to-delete)
- Navigation on card tap
- Undo / snackbar after Clear All
