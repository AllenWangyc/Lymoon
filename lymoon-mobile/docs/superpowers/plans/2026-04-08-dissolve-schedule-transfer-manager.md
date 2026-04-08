# Dissolve Schedule & Transfer Manager — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two Manager-only operations to the schedule detail page: (1) Dissolve Schedule — permanently hard-deletes a schedule via an atomic backend transaction with double-confirmation UI; (2) Transfer Manager — swaps the Manager role from the current user to a selected Member.

**Architecture:** Backend prerequisite is making `Notification.ScheduleId` nullable with ON DELETE SET NULL so that `schedule_dissolved` notifications survive the schedule deletion. `DissolveScheduleAsync` runs all deletes + notification inserts inside a single EF Core transaction. `TransferManagerAsync` updates two role rows then calls the notification service. Frontend adds two sequential `ConfirmActionSheet` components for dissolve and a new `ConfirmTransferView` state inside `ViewMembersSheet` for transfer.

**Tech Stack:** ASP.NET Core 8, EF Core + Npgsql, Expo SDK 52, React Native, TanStack Query v5, NativeWind v4

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `Lymoon.API/Models/Notification.cs` | Modify | `ScheduleId` → `Guid?`, `Schedule` → `Schedule?` |
| `Lymoon.API/Data/AppDbContext.cs` | Modify | FK: CASCADE → SET NULL on notifications |
| `Lymoon.API/Services/IScheduleService.cs` | Modify | Add `DissolveScheduleAsync`, `TransferManagerAsync` |
| `Lymoon.API/Services/INotificationService.cs` | Modify | Add `NotifyBecameManagerAsync` |
| `Lymoon.API/Services/NotificationService.cs` | Modify | Implement `NotifyBecameManagerAsync` |
| `Lymoon.API/Services/ScheduleService.cs` | Modify | Implement both new service methods |
| `Lymoon.API/DTOs/Schedules/TransferManagerRequest.cs` | Create | DTO for transfer endpoint |
| `Lymoon.API/Controllers/SchedulesController.cs` | Modify | Add DELETE `/{id}` and POST `/{id}/members/transfer-manager` |
| `lymoon-mobile/src/lib/queries/schedules.ts` | Modify | Add `useDissolveSchedule`, `useTransferManager` hooks |
| `lymoon-mobile/src/features/schedule/components/ScheduleOptionsMenu.tsx` | Modify | Add `onDissolve` prop; make dissolve the destructive item for managers |
| `lymoon-mobile/app/(app)/schedule/[id].tsx` | Modify | Add dissolve state, mutation, two `ConfirmActionSheet` components |
| `lymoon-mobile/src/features/schedule/components/ViewMembersSheet.tsx` | Modify | Add `transferTarget` state, `ConfirmTransferView`, Transfer Manager menu item |
| `lymoon-mobile/docs/API.md` | Modify | Document both new endpoints |

---

## Task 1: Make Notification.ScheduleId Nullable

> **Why:** The notification FK is currently `ON DELETE CASCADE`. When a schedule is deleted, its notifications would also be deleted — defeating the purpose of `schedule_dissolved` notifications. Changing to `ON DELETE SET NULL` lets notifications survive schedule deletion.

**Files:**
- Modify: `Lymoon.API/Models/Notification.cs`
- Modify: `Lymoon.API/Data/AppDbContext.cs`

- [ ] **Step 1: Update the Notification model**

  In `Lymoon.API/Models/Notification.cs`, replace the two navigation properties:

  ```csharp
  // Before
  public Guid ScheduleId { get; set; }
  public Schedule Schedule { get; set; } = null!;

  // After
  public Guid? ScheduleId { get; set; }
  public Schedule? Schedule { get; set; }
  ```

  The full file after the change:

  ```csharp
  namespace Lymoon.API.Models;

  public class Notification
  {
      public Guid Id { get; set; }
      public string UserId { get; set; } = string.Empty;
      public Guid? ScheduleId { get; set; }
      public string Type { get; set; } = string.Empty;
      public string Message { get; set; } = string.Empty;
      public bool IsRead { get; set; } = false;
      public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

      public AppUser User { get; set; } = null!;
      public Schedule? Schedule { get; set; }
  }
  ```

- [ ] **Step 2: Update AppDbContext FK to ON DELETE SET NULL**

  In `Lymoon.API/Data/AppDbContext.cs`, find the Notification entity configuration (lines 61–74) and change `OnDelete(DeleteBehavior.Cascade)` to `OnDelete(DeleteBehavior.SetNull)`:

  ```csharp
  modelBuilder.Entity<Notification>(entity =>
  {
      entity.ToTable("notifications");
      entity.HasKey(e => e.Id);
      entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
      entity.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
      entity.HasOne(e => e.Schedule)
            .WithMany(s => s.Notifications)
            .HasForeignKey(e => e.ScheduleId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
  });
  ```

- [ ] **Step 3: Add and apply the EF Core migration**

  ```bash
  cd Lymoon.API
  dotnet ef migrations add MakeNotificationScheduleIdNullable
  dotnet ef database update
  ```

  Expected output: migration applied successfully with no errors.

- [ ] **Step 4: Verify build**

  ```bash
  dotnet build
  ```

  Expected: Build succeeded, 0 Error(s).

---

## Task 2: Add Interface Methods

**Files:**
- Modify: `Lymoon.API/Services/IScheduleService.cs`
- Modify: `Lymoon.API/Services/INotificationService.cs`

- [ ] **Step 1: Add to IScheduleService**

  In `Lymoon.API/Services/IScheduleService.cs`, append after the `GetMemberWorkHoursAsync` declaration:

  ```csharp
  /// <exception cref="KeyNotFoundException">Schedule not found.</exception>
  /// <exception cref="UnauthorizedAccessException">Requester is not a Manager.</exception>
  Task DissolveScheduleAsync(Guid scheduleId, string requesterId);

  /// <exception cref="KeyNotFoundException">Target member not found (message: "member_not_found").</exception>
  /// <exception cref="InvalidOperationException">Target is already a Manager (message: "target_is_already_manager").</exception>
  /// <exception cref="UnauthorizedAccessException">Requester is not a Manager.</exception>
  Task TransferManagerAsync(Guid scheduleId, string requesterId, string targetUserId);
  ```

- [ ] **Step 2: Add to INotificationService**

  In `Lymoon.API/Services/INotificationService.cs`, append after `NotifyScheduleUpdatedAsync`:

  ```csharp
  /// <summary>Notify a user that they have been made the Manager of a schedule.</summary>
  Task NotifyBecameManagerAsync(string targetUserId, Guid scheduleId, string scheduleName);
  ```

- [ ] **Step 3: Verify build (will fail — implementations missing, that's expected)**

  ```bash
  dotnet build
  ```

  Expected: 2 compile errors about missing interface implementations in `ScheduleService` and `NotificationService`. Proceed to Task 3.

---

## Task 3: Implement NotifyBecameManagerAsync

**Files:**
- Modify: `Lymoon.API/Services/NotificationService.cs`

- [ ] **Step 1: Add the implementation**

  In `Lymoon.API/Services/NotificationService.cs`, append before the closing brace of the class (after `NotifyScheduleUpdatedAsync`):

  ```csharp
  public async Task NotifyBecameManagerAsync(string targetUserId, Guid scheduleId, string scheduleName)
  {
      _db.Notifications.Add(new Notification
      {
          Id = Guid.NewGuid(),
          UserId = targetUserId,
          ScheduleId = scheduleId,
          Type = "became_manager",
          Message = $"You are now the Manager of \"{scheduleName}\"."
      });

      await _db.SaveChangesAsync();
  }
  ```

- [ ] **Step 2: Verify build**

  ```bash
  dotnet build
  ```

  Expected: 1 compile error remains (ScheduleService still missing 2 methods). Proceed to Task 4.

---

## Task 4: Implement DissolveScheduleAsync

**Files:**
- Modify: `Lymoon.API/Services/ScheduleService.cs`

- [ ] **Step 1: Add the implementation**

  In `Lymoon.API/Services/ScheduleService.cs`, append before the closing brace of the class:

  ```csharp
  public async Task DissolveScheduleAsync(Guid scheduleId, string requesterId)
  {
      // Guard: requester must be a Manager (outside transaction — read-only check)
      var requesterMembership = await _db.ScheduleMembers
          .FirstOrDefaultAsync(m => m.ScheduleId == scheduleId && m.UserId == requesterId);

      if (requesterMembership == null)
          throw new KeyNotFoundException("Schedule not found.");

      if (requesterMembership.Role != "Manager")
          throw new UnauthorizedAccessException("Only a Manager can dissolve a schedule.");

      var schedule = await _db.Schedules.FindAsync(scheduleId)
          ?? throw new KeyNotFoundException("Schedule not found.");

      // Collect notification targets before deletion
      var memberIds = await _db.ScheduleMembers
          .Where(m => m.ScheduleId == scheduleId && m.UserId != requesterId)
          .Select(m => m.UserId)
          .ToListAsync();

      // Atomic transaction: insert notifications, delete all data
      await using var tx = await _db.Database.BeginTransactionAsync();
      try
      {
          // Insert dissolved notifications (ScheduleId becomes null after schedule is deleted via SET NULL)
          var now = DateTimeOffset.UtcNow;
          var notifications = memberIds.Select(uid => new Notification
          {
              Id = Guid.NewGuid(),
              UserId = uid,
              ScheduleId = scheduleId,
              Type = "schedule_dissolved",
              Message = $"The schedule \"{schedule.Title}\" has been dissolved."
          });
          await _db.Notifications.AddRangeAsync(notifications);

          // Delete shifts (cascade would handle this, but explicit is safer)
          var shifts = await _db.Shifts
              .Where(s => s.ScheduleId == scheduleId)
              .ToListAsync();
          _db.Shifts.RemoveRange(shifts);

          // Delete members
          var members = await _db.ScheduleMembers
              .Where(m => m.ScheduleId == scheduleId)
              .ToListAsync();
          _db.ScheduleMembers.RemoveRange(members);

          // Delete schedule (ON DELETE SET NULL nullifies the ScheduleId in the notifications we just inserted)
          _db.Schedules.Remove(schedule);

          await _db.SaveChangesAsync();
          await tx.CommitAsync();
      }
      catch
      {
          await tx.RollbackAsync();
          throw;
      }
  }
  ```

- [ ] **Step 2: Verify build**

  ```bash
  dotnet build
  ```

  Expected: 1 compile error remains (TransferManagerAsync missing). Proceed to Task 5.

---

## Task 5: Implement TransferManagerAsync

**Files:**
- Modify: `Lymoon.API/Services/ScheduleService.cs`

- [ ] **Step 1: Add the implementation**

  In `Lymoon.API/Services/ScheduleService.cs`, append after `DissolveScheduleAsync`:

  ```csharp
  public async Task TransferManagerAsync(Guid scheduleId, string requesterId, string targetUserId)
  {
      var requesterMembership = await _db.ScheduleMembers
          .FirstOrDefaultAsync(m => m.ScheduleId == scheduleId && m.UserId == requesterId);

      if (requesterMembership == null || requesterMembership.Role != "Manager")
          throw new UnauthorizedAccessException("Only a Manager can transfer manager rights.");

      var targetMembership = await _db.ScheduleMembers
          .FirstOrDefaultAsync(m => m.ScheduleId == scheduleId && m.UserId == targetUserId);

      if (targetMembership == null)
          throw new KeyNotFoundException("member_not_found");

      if (targetMembership.Role == "Manager")
          throw new InvalidOperationException("target_is_already_manager");

      var schedule = await _db.Schedules.FindAsync(scheduleId)
          ?? throw new KeyNotFoundException("Schedule not found.");

      requesterMembership.Role = "Member";
      targetMembership.Role = "Manager";
      await _db.SaveChangesAsync();

      await _notifications.NotifyBecameManagerAsync(targetUserId, scheduleId, schedule.Title);
  }
  ```

- [ ] **Step 2: Verify build**

  ```bash
  dotnet build
  ```

  Expected: Build succeeded, 0 Error(s).

---

## Task 6: Add Controller Endpoints and DTO

**Files:**
- Create: `Lymoon.API/DTOs/Schedules/TransferManagerRequest.cs`
- Modify: `Lymoon.API/Controllers/SchedulesController.cs`

- [ ] **Step 1: Create TransferManagerRequest DTO**

  Create `Lymoon.API/DTOs/Schedules/TransferManagerRequest.cs`:

  ```csharp
  using System.ComponentModel.DataAnnotations;

  namespace Lymoon.API.DTOs.Schedules;

  public class TransferManagerRequest
  {
      [Required]
      public string UserId { get; set; } = string.Empty;
  }
  ```

- [ ] **Step 2: Add the DELETE /api/schedules/{id} endpoint**

  In `Lymoon.API/Controllers/SchedulesController.cs`, add the following after the `RemoveMember` action (around line 202, before the `AddNextWeek` action). Also add the using for the new DTO at the top if it's not already present (the file already imports `Lymoon.API.DTOs.Schedules` via a using, so just add the method):

  First, verify the using statement `using Lymoon.API.DTOs.Schedules;` is at the top of the file. If not, add it.

  Then add the two new actions after the `RemoveMember` action:

  ```csharp
  // DELETE /api/schedules/{id}
  [HttpDelete("{id:guid}")]
  public async Task<IActionResult> DissolveSchedule(Guid id)
  {
      var userId = GetUserId();
      if (userId == null) return Unauthorized();

      try
      {
          await _scheduleService.DissolveScheduleAsync(id, userId);
          return Ok(new { ok = true });
      }
      catch (Exception ex) when (ex is KeyNotFoundException or UnauthorizedAccessException)
      {
          return HandleDomainException(ex);
      }
  }

  // POST /api/schedules/{id}/members/transfer-manager
  [HttpPost("{id:guid}/members/transfer-manager")]
  public async Task<IActionResult> TransferManager(Guid id, [FromBody] TransferManagerRequest request)
  {
      var userId = GetUserId();
      if (userId == null) return Unauthorized();

      try
      {
          await _scheduleService.TransferManagerAsync(id, userId, request.UserId);
          return Ok(new { ok = true });
      }
      catch (Exception ex) when (ex is KeyNotFoundException or InvalidOperationException or UnauthorizedAccessException)
      {
          return HandleDomainException(ex);
      }
  }
  ```

- [ ] **Step 3: Build and verify**

  ```bash
  dotnet build
  ```

  Expected: Build succeeded, 0 Error(s).

- [ ] **Step 4: Manual API smoke test**

  Start the API:
  ```bash
  dotnet run
  ```

  Test that the endpoints respond (use an auth token from a logged-in Manager):
  - `DELETE /api/schedules/{id}` → should return `200 { "ok": true }` for a valid Manager
  - `DELETE /api/schedules/{id}` with a non-Manager token → should return `403`
  - `POST /api/schedules/{id}/members/transfer-manager` with `{ "userId": "<memberId>" }` → `200 { "ok": true }`

- [ ] **Step 5: Commit the backend changes**

  ```bash
  cd ..
  git add Lymoon.API/Models/Notification.cs \
          Lymoon.API/Data/AppDbContext.cs \
          Lymoon.API/Data/Migrations/ \
          Lymoon.API/Services/IScheduleService.cs \
          Lymoon.API/Services/INotificationService.cs \
          Lymoon.API/Services/NotificationService.cs \
          Lymoon.API/Services/ScheduleService.cs \
          Lymoon.API/DTOs/Schedules/TransferManagerRequest.cs \
          Lymoon.API/Controllers/SchedulesController.cs
  git commit -m "feat: add DissolveSchedule and TransferManager endpoints

  - Make Notification.ScheduleId nullable with ON DELETE SET NULL
    so schedule_dissolved notifications survive schedule deletion
  - DissolveScheduleAsync uses EF Core transaction for atomicity
  - TransferManagerAsync swaps roles and notifies new manager"
  ```

---

## Task 7: Add Frontend Query Hooks

**Files:**
- Modify: `lymoon-mobile/src/lib/queries/schedules.ts`

- [ ] **Step 1: Import apiDelete**

  In `lymoon-mobile/src/lib/queries/schedules.ts`, the existing import line is:

  ```typescript
  import { apiGet, apiPost } from '@/lib/api';
  ```

  Change it to:

  ```typescript
  import { apiGet, apiPost, apiDelete } from '@/lib/api';
  ```

- [ ] **Step 2: Add useDissolveSchedule hook**

  Append after the `useRemoveMember` export (end of the schedules.ts file):

  ```typescript
  export function useDissolveSchedule(scheduleId: string) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: () => apiDelete<{ ok: boolean }>(`/schedules/${scheduleId}`),
      onSuccess: () => {
        qc.removeQueries({ queryKey: scheduleKeys.detail(scheduleId) });
        qc.invalidateQueries({ queryKey: scheduleKeys.all });
      },
    });
  }
  ```

- [ ] **Step 3: Add useTransferManager hook**

  Append after `useDissolveSchedule`:

  ```typescript
  export function useTransferManager(scheduleId: string) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (userId: string) =>
        apiPost<{ ok: boolean }>(`/schedules/${scheduleId}/members/transfer-manager`, { userId }),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
        qc.invalidateQueries({ queryKey: scheduleKeys.members(scheduleId) });
      },
    });
  }
  ```

- [ ] **Step 4: Verify TypeScript**

  ```bash
  cd lymoon-mobile
  npx tsc --noEmit
  ```

  Expected: No errors.

---

## Task 8: Update ScheduleOptionsMenu

**Files:**
- Modify: `lymoon-mobile/src/features/schedule/components/ScheduleOptionsMenu.tsx`

**Context:** `OptionsMenuCard` supports a single `destructiveItem` slot (rendered with a divider separator at the bottom). Currently, "Leave Schedule" is the `destructiveItem`. For managers, we move "Leave Schedule" into the regular `items` array (as a red item) and make "Dissolve Schedule" the new `destructiveItem`.

- [ ] **Step 1: Add onDissolve to Props type**

  In `ScheduleOptionsMenu.tsx`, update the `Props` type (line 7–17):

  ```typescript
  type Props = {
    visible: boolean;
    onClose: () => void;
    onLeave: () => void;
    onViewMembers: () => void;
    onDissolve?: () => void;
    inviteCode?: string;
    onInviteCopied?: () => void;
    isManager?: boolean;
    onRename?: () => void;
    onAddNextWeek?: () => void;
  };
  ```

- [ ] **Step 2: Update component signature**

  Update the function signature to destructure `onDissolve`:

  ```typescript
  export function ScheduleOptionsMenu({ visible, onClose, onLeave, onViewMembers, onDissolve, inviteCode, onInviteCopied, isManager, onRename, onAddNextWeek }: Props) {
  ```

- [ ] **Step 3: Restructure items and destructiveItem**

  Replace the entire `items` array and `destructiveItem` constant (lines 24–75) with:

  ```typescript
  const items: OptionsMenuItem[] = [
    {
      key: 'view-members',
      label: 'View Members',
      icon: 'people-outline',
      onPress: () => {
        onClose();
        onViewMembers();
      },
    },
    ...(isManager ? [{
      key: 'add-next-week',
      label: 'Add Next Week',
      icon: 'calendar-outline' as const,
      onPress: () => {
        onClose();
        onAddNextWeek?.();
      },
    }] : []),
    {
      key: 'copy-invite',
      label: 'Copy Invite Code',
      icon: 'link-outline',
      onPress: async () => {
        if (inviteCode) {
          await Clipboard.setStringAsync(inviteCode);
          onInviteCopied?.();
        }
        onClose();
      },
    },
    ...(isManager ? [
      {
        key: 'rename',
        label: 'Rename',
        icon: 'pencil-outline' as const,
        onPress: () => {
          onClose();
          onRename?.();
        },
      },
      {
        key: 'leave',
        label: 'Leave Schedule',
        icon: 'exit-outline' as const,
        color: '#dc2626',
        onPress: () => {
          onClose();
          onLeave();
        },
      },
    ] : []),
  ];

  const destructiveItem: OptionsMenuItem = isManager
    ? {
        key: 'dissolve',
        label: 'Dissolve Schedule',
        icon: 'trash-outline',
        color: '#dc2626',
        onPress: () => {
          onClose();
          onDissolve?.();
        },
      }
    : {
        key: 'leave',
        label: 'Leave Schedule',
        icon: 'exit-outline',
        color: '#dc2626',
        onPress: () => {
          onClose();
          onLeave();
        },
      };
  ```

- [ ] **Step 4: Verify TypeScript**

  ```bash
  npx tsc --noEmit
  ```

  Expected: No errors.

---

## Task 9: Add Dissolve Double-Confirmation in [id].tsx

**Files:**
- Modify: `lymoon-mobile/app/(app)/schedule/[id].tsx`

- [x] **Step 1: Add imports**

  In `[id].tsx`, update the imports from `@/lib/queries/schedules` (line 22–26) to add `useDissolveSchedule`:

  ```typescript
  import {
    useScheduleDetail,
    useRenameSchedule,
    useLeaveSchedule,
    useAddNextWeek,
    useDissolveSchedule,
  } from '@/lib/queries/schedules';
  ```

  Also import `ConfirmActionSheet` at the top of the import block:

  ```typescript
  import { ConfirmActionSheet } from '@/components/ConfirmActionSheet';
  ```

- [x] **Step 2: Add dissolve state**

  In the component body, after `const [renameVisible, setRenameVisible] = useState(false);` (line 53), add:

  ```typescript
  const [dissolveStep1Visible, setDissolveStep1Visible] = useState(false);
  const [dissolveStep2Visible, setDissolveStep2Visible] = useState(false);
  ```

- [x] **Step 3: Add dissolveMutation**

  After `const leaveMutation = useLeaveSchedule(id as string);` (line 76), add:

  ```typescript
  const dissolveMutation = useDissolveSchedule(id as string);
  ```

- [x] **Step 4: Add dissolve handler functions**

  Find `handleLeaveConfirm` in the file and add these two functions after it:

  ```typescript
  function handleDissolveStep1Confirm() {
    setDissolveStep1Visible(false);
    setTimeout(() => setDissolveStep2Visible(true), 200);
  }

  function handleDissolveStep2Confirm() {
    setDissolveStep2Visible(false);
    dissolveMutation.mutate(undefined, {
      onSuccess: () => {
        router.replace('/');
      },
      onError: (err) => {
        showToast(err instanceof Error ? err.message : 'Failed to dissolve schedule.', 'error');
      },
    });
  }
  ```

- [x] **Step 5: Pass onDissolve to ScheduleOptionsMenu**

  Find the `<ScheduleOptionsMenu ... />` block (around line 288) and add the `onDissolve` prop:

  ```tsx
  <ScheduleOptionsMenu
    visible={menuOpen}
    onClose={() => setMenuOpen(false)}
    onLeave={() => {
      setTimeout(() => setLeaveConfirmVisible(true), 160);
    }}
    onViewMembers={() => {
      setTimeout(() => setViewMembersVisible(true), 160);
    }}
    onDissolve={() => {
      setTimeout(() => setDissolveStep1Visible(true), 160);
    }}
    inviteCode={scheduleDetail.inviteCode}
    onInviteCopied={() => showToast('Invite code copied!', 'success')}
    isManager={isManager}
    onRename={() => setTimeout(() => setRenameVisible(true), 160)}
    onAddNextWeek={handleAddNextWeek}
  />
  ```

- [x] **Step 6: Add the two ConfirmActionSheet components**

  After the closing `</RenameScheduleSheet>` tag (around line 326), add:

  ```tsx
  <ConfirmActionSheet
    visible={dissolveStep1Visible}
    onClose={() => setDissolveStep1Visible(false)}
    onConfirm={handleDissolveStep1Confirm}
    title="Dissolve Schedule?"
    message="This will permanently delete all shifts and remove all members. This action cannot be undone."
    confirmLabel="Dissolve"
    iconName="warning-outline"
    iconColor="#dc2626"
    iconBg="rgba(220,38,38,0.10)"
    confirmColor="#dc2626"
  />

  <ConfirmActionSheet
    visible={dissolveStep2Visible}
    onClose={() => setDissolveStep2Visible(false)}
    onConfirm={handleDissolveStep2Confirm}
    title="Are you absolutely sure?"
    message={`You're about to dissolve "${scheduleDetail?.title ?? 'this schedule'}". All data will be lost forever.`}
    confirmLabel="Yes, Dissolve"
    iconName="trash-outline"
    iconColor="#dc2626"
    iconBg="rgba(220,38,38,0.10)"
    confirmColor="#dc2626"
  />
  ```

- [x] **Step 7: Verify TypeScript**

  ```bash
  npx tsc --noEmit
  ```

  Expected: No errors.

---

## Task 10: Add Transfer Manager in ViewMembersSheet

**Files:**
- Modify: `lymoon-mobile/src/features/schedule/components/ViewMembersSheet.tsx`

- [x] **Step 1: Import useTransferManager**

  Find the existing import:

  ```typescript
  import { useScheduleMembers, useRemoveMember } from '@/lib/queries/schedules';
  ```

  Change to:

  ```typescript
  import { useScheduleMembers, useRemoveMember, useTransferManager } from '@/lib/queries/schedules';
  ```

- [x] **Step 2: Add ConfirmTransferView sub-component**

  Add the following new component after the closing brace of `ConfirmRemoveView` (after line 218, before the `// ─── MemberCard` comment):

  ```typescript
  // ─── ConfirmTransferView ─────────────────────────────────────────────────────

  type ConfirmTransferViewProps = {
    employee: Employee;
    onBack: () => void;
    onConfirm: () => void;
    isPending: boolean;
  };

  function ConfirmTransferView({ employee, onBack, onConfirm, isPending }: ConfirmTransferViewProps) {
    return (
      <View className="h-[456px] px-6 pt-4 pb-6">
        {/* Header */}
        <View className="h-10 flex-row items-center mb-2">
          <TouchableOpacity
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-8 h-8 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Confirmation content */}
        <View className="flex-1 items-center justify-center gap-5">
          <View
            className="size-16 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(234,179,8,0.12)' }}
          >
            <Ionicons name="shield-checkmark-outline" size={30} color="#ca8a04" />
          </View>
          <View className="items-center gap-2">
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#1e293b', textAlign: 'center' }}>
              Transfer Manager to {employee.name}?
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18 }}>
              {employee.name} will become the Manager. You will become a Member and lose manager permissions.
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onConfirm}
            disabled={isPending}
            className="h-12 rounded-[12px] items-center justify-center"
            style={{ backgroundColor: isPending ? '#bef264' : '#65a30d' }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>
              {isPending ? 'Transferring…' : 'Transfer'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onBack}
            disabled={isPending}
            className="h-12 rounded-[12px] items-center justify-center border border-[#e2e8f0]"
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  ```

- [x] **Step 3: Add onTransferSuccess/onTransferError to Props**

  In `ViewMembersSheet.tsx`, update the `Props` type (lines 13–21):

  ```typescript
  type Props = {
    visible: boolean;
    onClose: () => void;
    scheduleId: string;
    isManager: boolean;
    currentUserId: string;
    onRemoveSuccess?: () => void;
    onRemoveError?: (msg: string) => void;
    onTransferSuccess?: () => void;
    onTransferError?: (msg: string) => void;
  };
  ```

  Update the component signature to destructure the new props:

  ```typescript
  export function ViewMembersSheet({ visible, onClose, scheduleId, isManager, currentUserId, onRemoveSuccess, onRemoveError, onTransferSuccess, onTransferError }: Props) {
  ```

- [x] **Step 4: Add transferTarget state and mutation in ViewMembersSheet**

  In the `ViewMembersSheet` function body, after `const [removeTarget, setRemoveTarget] = useState<Employee | null>(null);` (line 302), add:

  ```typescript
  const [transferTarget, setTransferTarget] = useState<Employee | null>(null);
  ```

  After `const removeMember = useRemoveMember(scheduleId);` (line 307), add:

  ```typescript
  const transferManager = useTransferManager(scheduleId);
  ```

- [x] **Step 5: Add transfer handlers**

  After `handleRemoveConfirm` function, add:

  ```typescript
  function handleTransferPress(employee: Employee) {
    closeMenu();
    setTransferTarget(employee);
  }

  function handleTransferConfirm() {
    if (!transferTarget) return;
    const targetId = transferTarget.id;
    setTransferTarget(null);
    transferManager.mutate(targetId, {
      onSuccess: () => onTransferSuccess?.(),
      onError: (err: Error) => {
        const msg =
          err.message === 'target_is_already_manager'
            ? 'This member is already a Manager.'
            : err.message === 'member_not_found'
              ? 'This user is no longer a member of this schedule.'
              : 'Failed to transfer manager role.';
        onTransferError?.(msg);
      },
    });
  }
  ```

- [x] **Step 6: Reset transferTarget in the visible=false effect**

  Find the `useEffect` that resets state on close (line 321–327):

  ```typescript
  useEffect(() => {
    if (!visible) {
      setMenuState(null);
      setWorkHoursEmployee(null);
      setRemoveTarget(null);
    }
  }, [visible]);
  ```

  Add `setTransferTarget(null)`:

  ```typescript
  useEffect(() => {
    if (!visible) {
      setMenuState(null);
      setWorkHoursEmployee(null);
      setRemoveTarget(null);
      setTransferTarget(null);
    }
  }, [visible]);
  ```

- [x] **Step 7: Add Transfer Manager item to the OptionsMenuCard**

  Find the `items` array inside the `{menuState && ...}` block (around line 422–432). Currently:

  ```typescript
  items={[
    {
      key: 'view-work-hours',
      label: 'View Work Hours',
      icon: 'time-outline',
      onPress: () => {
        closeMenu();
        setWorkHoursEmployee(menuState.employee);
      },
    },
  ]}
  ```

  Change to:

  ```typescript
  items={[
    {
      key: 'view-work-hours',
      label: 'View Work Hours',
      icon: 'time-outline',
      onPress: () => {
        closeMenu();
        setWorkHoursEmployee(menuState.employee);
      },
    },
    ...(isManager &&
      menuState.employee.id !== currentUserId &&
      menuState.employee.role !== 'Manager'
      ? [{
          key: 'transfer-manager',
          label: 'Transfer Manager',
          icon: 'shield-checkmark-outline' as const,
          onPress: () => handleTransferPress(menuState.employee),
          disabled: transferManager.isPending,
        }]
      : []),
  ]}
  ```

- [x] **Step 8: Add transferTarget to the render ternary**

  Find the ternary render in the `return` (line 363–376):

  ```tsx
  {workHoursEmployee ? (
    <WorkHoursView ... />
  ) : removeTarget ? (
    <ConfirmRemoveView ... />
  ) : (
    <View ref={containerRef} ...>
  ```

  Add the `transferTarget` branch:

  ```tsx
  {workHoursEmployee ? (
    <WorkHoursView
      employee={workHoursEmployee}
      scheduleId={scheduleId}
      onBack={() => setWorkHoursEmployee(null)}
    />
  ) : removeTarget ? (
    <ConfirmRemoveView
      employee={removeTarget}
      onBack={() => setRemoveTarget(null)}
      onConfirm={handleRemoveConfirm}
      isPending={removeMember.isPending}
    />
  ) : transferTarget ? (
    <ConfirmTransferView
      employee={transferTarget}
      onBack={() => setTransferTarget(null)}
      onConfirm={handleTransferConfirm}
      isPending={transferManager.isPending}
    />
  ) : (
    <View ref={containerRef} className="h-[456px]">
  ```

- [x] **Step 9: Pass new callbacks from [id].tsx**

  In `lymoon-mobile/app/(app)/schedule/[id].tsx`, find the `<ViewMembersSheet ... />` block and add the two new props:

  ```tsx
  <ViewMembersSheet
    visible={viewMembersVisible}
    onClose={() => setViewMembersVisible(false)}
    scheduleId={id as string}
    isManager={isManager}
    currentUserId={userId}
    onRemoveSuccess={() => showToast('Member removed', 'success')}
    onRemoveError={(msg) => showToast(msg, 'error')}
    onTransferSuccess={() => showToast('Manager role transferred', 'success')}
    onTransferError={(msg) => showToast(msg, 'error')}
  />
  ```

- [x] **Step 10: Verify TypeScript**

  ```bash
  npx tsc --noEmit
  ```

  Expected: No errors.

- [ ] **Step 11: Commit frontend changes**

  ```bash
  git add lymoon-mobile/src/lib/queries/schedules.ts \
          lymoon-mobile/src/features/schedule/components/ScheduleOptionsMenu.tsx \
          lymoon-mobile/app/(app)/schedule/[id].tsx \
          lymoon-mobile/src/features/schedule/components/ViewMembersSheet.tsx
  git commit -m "feat: dissolve schedule and transfer manager UI

  - Dissolve: two-step ConfirmActionSheet in schedule detail page
  - Transfer Manager: ConfirmTransferView inside ViewMembersSheet
  - ScheduleOptionsMenu: dissolve is destructiveItem for managers"
  ```

---

## Task 11: Update docs/API.md

**Files:**
- Modify: `lymoon-mobile/docs/API.md`

- [x] **Step 1: Update the Overview methods note**

  Find the Overview section (line 10):

  ```markdown
  - **Methods:** Only `GET` and `POST` are used across the entire API
  ```

  Change to:

  ```markdown
  - **Methods:** `GET`, `POST`, and `DELETE` are used across the API
  ```

- [x] **Step 2: Add the Dissolve Schedule endpoint**

  Find the `### Remove Member` section and add the new endpoint **after** it (before `## Shifts`):

  ````markdown
  ### Dissolve Schedule
  `DELETE /api/schedules/{id}`

  Manager only. Permanently deletes the schedule, all its shifts, and all member records. All other members receive a `schedule_dissolved` notification. This operation is wrapped in a database transaction and cannot be partially applied.

  **Response `200`:**
  ```json
  { "ok": true }
  ```

  **Error codes:**
  | Error | HTTP | Meaning |
  |-------|------|---------|
  | `Only a Manager can dissolve a schedule.` | 403 | Requester is not a Manager |
  | `Schedule not found.` | 404 | Schedule does not exist |

  ---

  ### Transfer Manager
  `POST /api/schedules/{id}/members/transfer-manager`

  Manager only. Transfers the Manager role from the requester to a Member. The requester is downgraded to Member. The target receives a `became_manager` notification.

  **Request body:**
  ```json
  {
    "userId": "string"
  }
  ```

  **Response `200`:**
  ```json
  { "ok": true }
  ```

  **Error codes:**
  | Error | HTTP | Meaning |
  |-------|------|---------|
  | `Only a Manager can transfer manager rights.` | 403 | Requester is not a Manager |
  | `member_not_found` | 404 | Target user is not a member |
  | `target_is_already_manager` | 409 | Target is already a Manager |

  ---
  ````

- [x] **Step 3: Commit docs**

  ```bash
  git add lymoon-mobile/docs/API.md
  git commit -m "docs: add Dissolve Schedule and Transfer Manager endpoints to API.md"
  ```

---

## Verification

- [ ] **End-to-end: Dissolve Schedule**
  1. Log in as a Manager. Open a schedule with at least one other member.
  2. Tap the three-dot menu → "Dissolve Schedule" (red, at bottom with divider).
  3. First confirmation sheet appears. Tap "Dissolve".
  4. Second confirmation sheet appears with the schedule name. Tap "Yes, Dissolve".
  5. App navigates to Home. Schedule is gone from the list.
  6. Log in as the other member. Check notification center — `schedule_dissolved` notification is present with the schedule name.

- [ ] **End-to-end: Transfer Manager**
  1. Log in as a Manager. Open a schedule with at least one Member.
  2. Open member list → tap three-dot on a Member card.
  3. "Transfer Manager" item is visible (not shown for own card or other Manager cards).
  4. Tap "Transfer Manager" → `ConfirmTransferView` appears.
  5. Tap "Transfer". Sheet closes. The selected member now shows the "Manager" badge. Manager-only actions disappear from the current user's view.
  6. Log in as the promoted member. Check notification center — `became_manager` notification is present.

- [ ] **Guard cases**
  - Non-Manager user: "Dissolve Schedule" is not visible in three-dot menu; Transfer Manager is not visible in member cards.
  - `DELETE /api/schedules/{id}` with a Member token → `403`.
  - Transfer to an existing Manager → `409 target_is_already_manager`.
