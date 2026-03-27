using Lymoon.API.Data;
using Lymoon.API.DTOs.Schedules;
using Lymoon.API.DTOs.Shifts;
using Lymoon.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Lymoon.API.Services;

public class ShiftService : IShiftService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notifications;

    public ShiftService(AppDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<ShiftDto?> AddShiftAsync(Guid scheduleId, string requesterId, AddShiftRequest request)
    {
        var membership = await _db.ScheduleMembers
            .FirstOrDefaultAsync(m => m.ScheduleId == scheduleId && m.UserId == requesterId);

        if (membership == null) return null;

        var schedule = await _db.Schedules.FindAsync(scheduleId);
        if (schedule == null) return null;

        var isManager = membership.Role == "Manager";
        var isFullCollab = schedule.MemberPermission == "full_collaboration";
        var isSelf = request.EmployeeId == requesterId;

        if (!isManager && !isFullCollab && !isSelf)
            throw new UnauthorizedAccessException("You can only add shifts for yourself.");

        if (!TimeOnly.TryParse(request.StartTime, out var startTime))
            throw new ArgumentException("Invalid startTime format. Expected HH:mm.");

        if (!TimeOnly.TryParse(request.EndTime, out var endTime))
            throw new ArgumentException("Invalid endTime format. Expected HH:mm.");

        if (startTime >= endTime)
            throw new ArgumentException("startTime must be earlier than endTime.");

        var shift = new Shift
        {
            Id = Guid.NewGuid(),
            ScheduleId = scheduleId,
            UserId = request.EmployeeId,
            WeekStart = schedule.CurrentWeek,
            DayOfWeek = request.DayOfWeek,
            StartTime = startTime,
            EndTime = endTime,
            ShiftType = request.ShiftType
        };

        _db.Shifts.Add(shift);
        await _db.SaveChangesAsync();

        return MapToDto(shift);
    }

    public async Task<ShiftDto?> UpdateShiftAsync(Guid shiftId, string requesterId, UpdateShiftRequest request)
    {
        var shift = await _db.Shifts
            .Include(s => s.Schedule)
            .FirstOrDefaultAsync(s => s.Id == shiftId);

        if (shift == null) return null;

        var membership = await _db.ScheduleMembers
            .FirstOrDefaultAsync(m => m.ScheduleId == shift.ScheduleId && m.UserId == requesterId);

        if (membership == null)
            throw new UnauthorizedAccessException("You are not a member of this schedule.");

        var isManager = membership.Role == "Manager";
        var isFullCollab = shift.Schedule.MemberPermission == "full_collaboration";
        var isOwner = shift.UserId == requesterId;

        if (!isManager && !isFullCollab && !isOwner)
            throw new UnauthorizedAccessException("You can only edit your own shifts.");

        if (!TimeOnly.TryParse(request.StartTime, out var startTime))
            throw new ArgumentException("Invalid startTime format. Expected HH:mm.");

        if (!TimeOnly.TryParse(request.EndTime, out var endTime))
            throw new ArgumentException("Invalid endTime format. Expected HH:mm.");

        if (startTime >= endTime)
            throw new ArgumentException("startTime must be earlier than endTime.");

        shift.StartTime = startTime;
        shift.EndTime = endTime;
        shift.ShiftType = request.ShiftType;

        await _db.SaveChangesAsync();
        await _notifications.NotifyShiftModifiedAsync(shift, requesterId);

        return MapToDto(shift);
    }

    public async Task<bool> DeleteShiftAsync(Guid shiftId, string requesterId)
    {
        var shift = await _db.Shifts
            .Include(s => s.Schedule)
            .FirstOrDefaultAsync(s => s.Id == shiftId);

        if (shift == null) return false;

        var membership = await _db.ScheduleMembers
            .FirstOrDefaultAsync(m => m.ScheduleId == shift.ScheduleId && m.UserId == requesterId);

        if (membership == null)
            throw new UnauthorizedAccessException("You are not a member of this schedule.");

        var isManager = membership.Role == "Manager";
        var isFullCollab = shift.Schedule.MemberPermission == "full_collaboration";
        var isOwner = shift.UserId == requesterId;

        if (!isManager && !isFullCollab && !isOwner)
            throw new UnauthorizedAccessException("You can only delete your own shifts.");

        // Capture shift data before removal for notification
        var shiftSnapshot = new Shift
        {
            UserId = shift.UserId,
            ScheduleId = shift.ScheduleId,
            DayOfWeek = shift.DayOfWeek
        };

        _db.Shifts.Remove(shift);
        await _db.SaveChangesAsync();

        await _notifications.NotifyShiftDeletedAsync(shiftSnapshot, requesterId);

        return true;
    }

    private static ShiftDto MapToDto(Shift shift) => new()
    {
        Id = shift.Id.ToString(),
        EmployeeId = shift.UserId,
        DayOfWeek = shift.DayOfWeek,
        StartTime = shift.StartTime.ToString("HH:mm"),
        EndTime = shift.EndTime.ToString("HH:mm"),
        ShiftType = shift.ShiftType
    };
}
