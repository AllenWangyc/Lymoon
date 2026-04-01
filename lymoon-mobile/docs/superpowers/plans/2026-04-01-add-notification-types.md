# Add 3 New Notification Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `shift_added`, `member_joined`, and `schedule_updated` notification types to both backend and frontend.

**Architecture:** Follow the existing pattern: (1) add method to `INotificationService`, (2) implement in `NotificationService`, (3) call from the relevant service method, (4) add type to frontend union + UI label.

**Tech Stack:** ASP.NET Core (.NET 8), Entity Framework Core, TypeScript, React Native (Expo)

---

## File Map

| File | Change |
|---|---|
| `Lymoon.API/Services/INotificationService.cs` | Add 3 new method signatures |
| `Lymoon.API/Services/NotificationService.cs` | Implement 3 new methods |
| `Lymoon.API/Services/ShiftService.cs` | Call `NotifyShiftAddedAsync` in `AddShiftAsync` |
| `Lymoon.API/Services/ScheduleService.cs` | Call `NotifyMemberJoinedAsync` in `JoinByCodeAsync`; call `NotifyScheduleUpdatedAsync` in `RenameScheduleAsync` |
| `lymoon-mobile/src/lib/queries/notifications.ts` | Extend `NotificationType` union |
| `lymoon-mobile/app/(app)/notifications/index.tsx` | Add entries to `TYPE_LABELS` |

---

## Task 1: Extend `INotificationService` with 3 new method signatures

**Files:**
- Modify: `Lymoon.API/Services/INotificationService.cs`

- [x] **Step 1: Add method signatures**

Replace the existing interface content with:

```csharp
using Lymoon.API.DTOs.Notifications;
using Lymoon.API.Models;

namespace Lymoon.API.Services;

public interface INotificationService
{
    Task<List<NotificationDto>> GetNotificationsAsync(string userId);
    Task MarkReadAsync(string userId, List<string> notificationIds);

    /// <summary>Notify shift owner that another user modified their shift. No-op if actorId == shift owner.</summary>
    Task NotifyShiftModifiedAsync(Shift shift, string actorId);

    /// <summary>Notify shift owner that another user deleted their shift. No-op if actorId == shift owner.</summary>
    Task NotifyShiftDeletedAsync(Shift shift, string actorId);

    /// <summary>Notify all current members of a schedule that a new week has been added.</summary>
    Task NotifyNewWeekAsync(Guid scheduleId, string scheduleName);

    /// <summary>Notify a specific user that they were removed from a schedule.</summary>
    Task NotifyRemovedFromScheduleAsync(string userId, Guid scheduleId, string scheduleName);

    /// <summary>Notify shift owner that another user added a shift for them. No-op if actorId == shift owner.</summary>
    Task NotifyShiftAddedAsync(Shift shift, string actorId);

    /// <summary>Notify all existing schedule members (excluding the new joiner) that someone joined.</summary>
    Task NotifyMemberJoinedAsync(Guid scheduleId, string scheduleName, string newMemberUserId);

    /// <summary>Notify all schedule members that the schedule was renamed.</summary>
    Task NotifyScheduleUpdatedAsync(Guid scheduleId, string newTitle);
}
```

- [x] **Step 2: Build to confirm no compile errors**

```bash
cd Lymoon.API && dotnet build
```
Expected: Errors about `NotificationService` not implementing the new members — that's correct for now.

---

## Task 2: Implement 3 new methods in `NotificationService`

**Files:**
- Modify: `Lymoon.API/Services/NotificationService.cs`

- [x] **Step 1: Add `NotifyShiftAddedAsync` method**

After the closing brace of `NotifyRemovedFromScheduleAsync` (line ~117) and before `GetDisplayNameAsync`, insert:

```csharp
public async Task NotifyShiftAddedAsync(Shift shift, string actorId)
{
    if (shift.UserId == actorId) return;

    var actorName = await GetDisplayNameAsync(actorId);
    var dayName = DayNames[shift.DayOfWeek];

    _db.Notifications.Add(new Notification
    {
        Id = Guid.NewGuid(),
        UserId = shift.UserId,
        ScheduleId = shift.ScheduleId,
        Type = "shift_added",
        Message = $"{actorName} added a shift for you on {dayName}"
    });

    await _db.SaveChangesAsync();
}
```

- [x] **Step 2: Add `NotifyMemberJoinedAsync` method**

Insert after `NotifyShiftAddedAsync`:

```csharp
public async Task NotifyMemberJoinedAsync(Guid scheduleId, string scheduleName, string newMemberUserId)
{
    var newMemberName = await GetDisplayNameAsync(newMemberUserId);

    var existingMemberIds = await _db.ScheduleMembers
        .Where(m => m.ScheduleId == scheduleId && m.UserId != newMemberUserId)
        .Select(m => m.UserId)
        .ToListAsync();

    var notifications = existingMemberIds.Select(userId => new Notification
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        ScheduleId = scheduleId,
        Type = "member_joined",
        Message = $"{newMemberName} joined {scheduleName}"
    });

    _db.Notifications.AddRange(notifications);
    await _db.SaveChangesAsync();
}
```

- [x] **Step 3: Add `NotifyScheduleUpdatedAsync` method**

Insert after `NotifyMemberJoinedAsync`:

```csharp
public async Task NotifyScheduleUpdatedAsync(Guid scheduleId, string newTitle)
{
    var memberIds = await _db.ScheduleMembers
        .Where(m => m.ScheduleId == scheduleId)
        .Select(m => m.UserId)
        .ToListAsync();

    var notifications = memberIds.Select(userId => new Notification
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        ScheduleId = scheduleId,
        Type = "schedule_updated",
        Message = $"Schedule was renamed to \"{newTitle}\""
    });

    _db.Notifications.AddRange(notifications);
    await _db.SaveChangesAsync();
}
```

- [x] **Step 4: Build to confirm `NotificationService` now satisfies the interface**

```bash
cd Lymoon.API && dotnet build
```
Expected: Build errors should now only be in callers (ShiftService, ScheduleService) — or clean build if they're not yet compiled against new interface.

---

## Task 3: Call `NotifyShiftAddedAsync` in `ShiftService.AddShiftAsync`

**Files:**
- Modify: `Lymoon.API/Services/ShiftService.cs` (around line 58–62)

- [x] **Step 1: Add notification call after SaveChangesAsync in `AddShiftAsync`**

Current code at lines 58–62:
```csharp
        _db.Shifts.Add(shift);
        await _db.SaveChangesAsync();

        return MapToDto(shift);
```

Replace with:
```csharp
        _db.Shifts.Add(shift);
        await _db.SaveChangesAsync();

        await _notifications.NotifyShiftAddedAsync(shift, requesterId);

        return MapToDto(shift);
```

- [x] **Step 2: Build**

```bash
cd Lymoon.API && dotnet build
```
Expected: No errors from ShiftService.

---

## Task 4: Call notification methods in `ScheduleService`

**Files:**
- Modify: `Lymoon.API/Services/ScheduleService.cs`

### 4a: `JoinByCodeAsync` → `NotifyMemberJoinedAsync`

- [x] **Step 1: Add notification call after `SaveChangesAsync` in `JoinByCodeAsync`**

Current code around lines 175–191:
```csharp
        _db.ScheduleMembers.Add(new ScheduleMember
        {
            ScheduleId = schedule.Id,
            UserId = userId,
            Role = "Member"
        });
        await _db.SaveChangesAsync();

        var manager = schedule.Members.FirstOrDefault(m => m.Role == "Manager");
```

Replace with:
```csharp
        _db.ScheduleMembers.Add(new ScheduleMember
        {
            ScheduleId = schedule.Id,
            UserId = userId,
            Role = "Member"
        });
        await _db.SaveChangesAsync();

        await _notifications.NotifyMemberJoinedAsync(schedule.Id, schedule.Title, userId);

        var manager = schedule.Members.FirstOrDefault(m => m.Role == "Manager");
```

### 4b: `RenameScheduleAsync` → `NotifyScheduleUpdatedAsync`

- [x] **Step 2: Add notification call after `SaveChangesAsync` in `RenameScheduleAsync`**

Current code at lines 133–136:
```csharp
        schedule.Title = newTitle;
        await _db.SaveChangesAsync();
        return true;
```

Replace with:
```csharp
        schedule.Title = newTitle;
        await _db.SaveChangesAsync();

        await _notifications.NotifyScheduleUpdatedAsync(scheduleId, newTitle);

        return true;
```

- [x] **Step 3: Full build**

```bash
cd Lymoon.API && dotnet build
```
Expected: Clean build, 0 errors.

---

## Task 5: Frontend — extend `NotificationType` union

**Files:**
- Modify: `lymoon-mobile/src/lib/queries/notifications.ts` (lines 6–10)

- [x] **Step 1: Add 3 new types to the union**

Current:
```typescript
export type NotificationType =
  | 'shift_modified'
  | 'shift_deleted'
  | 'new_week_added'
  | 'removed_from_schedule';
```

Replace with:
```typescript
export type NotificationType =
  | 'shift_modified'
  | 'shift_deleted'
  | 'new_week_added'
  | 'removed_from_schedule'
  | 'shift_added'
  | 'member_joined'
  | 'schedule_updated';
```

---

## Task 6: Frontend — add UI labels for new types

**Files:**
- Modify: `lymoon-mobile/app/(app)/notifications/index.tsx` (lines 8–13)

- [x] **Step 1: Add entries in `TYPE_LABELS`**

Current:
```typescript
const TYPE_LABELS: Record<string, string> = {
  shift_modified: 'Shift Modified',
  shift_deleted: 'Shift Deleted',
  new_week_added: 'New Week Added',
  removed_from_schedule: 'Removed from Schedule',
};
```

Replace with:
```typescript
const TYPE_LABELS: Record<string, string> = {
  shift_modified: 'Shift Modified',
  shift_deleted: 'Shift Deleted',
  new_week_added: 'New Week Added',
  removed_from_schedule: 'Removed from Schedule',
  shift_added: 'Shift Added',
  member_joined: 'New Member',
  schedule_updated: 'Schedule Updated',
};
```

---

## Verification

1. **Backend smoke test** — run the API and test via curl or the app:
   - Add a shift for another user → that user should receive a `shift_added` notification
   - Join a schedule via invite code → all existing members should receive a `member_joined` notification
   - Manager renames a schedule → all members should receive a `schedule_updated` notification

2. **Frontend check** — open the Notifications screen and confirm the 3 new label strings appear correctly for each type.

3. **Self-notification guard** — adding a shift for yourself should NOT produce a `shift_added` notification (same guard as `shift_modified`/`shift_deleted`).
