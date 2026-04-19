# Schedule Cards Sort by Creation Time — Design Spec

**Date:** 2026-04-19  
**Status:** Approved

---

## Problem

The home page schedule card list has no defined order. Cards appear in database-insertion order, which is non-deterministic and confusing to users.

## Goal

Schedule cards on the home page are always displayed newest-first (most recently created at the top).

---

## Design

### Backend

**`Models/Schedule.cs`**  
Add one property:
```csharp
public DateTimeOffset CreatedAt { get; set; }
```
Set to `DateTimeOffset.UtcNow` when the entity is constructed in `CreateScheduleAsync`.

**EF Migration**  
Add column `created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`.  
Existing rows receive `NOW()` at migration time — their relative order is not guaranteed to reflect true creation order, but all schedules created after migration will be correctly ordered.

**`Services/ScheduleService.cs` — `GetUserSchedulesAsync`**  
Add `.OrderByDescending(s => s.CreatedAt)` before `.ToListAsync()`.

### Frontend

No changes required. The API response is already consumed as an ordered array; the `filteredSchedules` filter chain preserves insertion order.

### DTO

`ScheduleItemDto` is **not** updated — `CreatedAt` is an internal sort key only and does not need to be exposed to clients.

---

## Files Changed

| File | Change |
|---|---|
| `Lymoon.API/Models/Schedule.cs` | Add `CreatedAt` property |
| `Lymoon.API/Services/ScheduleService.cs` | Add `OrderByDescending(s => s.CreatedAt)` |
| `Lymoon.API/Data/Migrations/<timestamp>_AddScheduleCreatedAt.cs` | New EF migration |

---

## Out of Scope

- Exposing `createdAt` to the frontend
- User-configurable sort order
- Retroactively correcting the `CreatedAt` value for existing schedules
