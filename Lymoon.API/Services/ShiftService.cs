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

        if (!DateOnly.TryParse(request.WeekStart, out var weekStart))
            throw new ArgumentException("Invalid weekStart format. Expected yyyy-MM-dd.");

        // Merge any overlapping or adjacent shifts for the same user/day/week
        var overlapping = await _db.Shifts
            .Where(s => s.ScheduleId == scheduleId
                     && s.UserId == request.EmployeeId
                     && s.DayOfWeek == request.DayOfWeek
                     && s.WeekStart == weekStart
                     && s.StartTime <= endTime
                     && startTime <= s.EndTime)
            .ToListAsync();

        var mergedStart = overlapping.Count > 0
            ? overlapping.Aggregate(startTime, (min, s) => s.StartTime < min ? s.StartTime : min)
            : startTime;
        var mergedEnd = overlapping.Count > 0
            ? overlapping.Aggregate(endTime, (max, s) => s.EndTime > max ? s.EndTime : max)
            : endTime;

        if (overlapping.Count > 0)
            _db.Shifts.RemoveRange(overlapping);

        var shift = new Shift
        {
            Id = Guid.NewGuid(),
            ScheduleId = scheduleId,
            UserId = request.EmployeeId,
            WeekStart = weekStart,
            DayOfWeek = request.DayOfWeek,
            StartTime = mergedStart,
            EndTime = mergedEnd,
            ShiftType = request.ShiftType
        };

        _db.Shifts.Add(shift);
        await _db.SaveChangesAsync();

        await _notifications.NotifyShiftAddedAsync(shift, requesterId);

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

        // Merge any overlapping or adjacent shifts for the same user/day/week
        var overlapping = await _db.Shifts
            .Where(s => s.Id != shift.Id
                     && s.ScheduleId == shift.ScheduleId
                     && s.UserId == shift.UserId
                     && s.DayOfWeek == shift.DayOfWeek
                     && s.WeekStart == shift.WeekStart
                     && s.StartTime <= endTime
                     && startTime <= s.EndTime)
            .ToListAsync();

        if (overlapping.Count > 0)
        {
            shift.StartTime = overlapping.Aggregate(startTime, (min, s) => s.StartTime < min ? s.StartTime : min);
            shift.EndTime = overlapping.Aggregate(endTime, (max, s) => s.EndTime > max ? s.EndTime : max);
            _db.Shifts.RemoveRange(overlapping);
        }

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

    public async Task<List<MyShiftDto>> GetMyShiftsAsync(string requesterId, DateOnly from, DateOnly to)
    {
        // Only return shifts from schedules the user is currently a member of.
        var memberScheduleIds = await _db.ScheduleMembers
            .Where(m => m.UserId == requesterId)
            .Select(m => m.ScheduleId)
            .ToListAsync();

        // A shift's actual date = weekStart + dayOfWeek days.
        // Broaden the weekStart range to cover all possible dates in [from, to].
        var weekStartMin = from.AddDays(-6);

        var shifts = await _db.Shifts
            .Include(s => s.Schedule)
            .Where(s => s.UserId == requesterId
                     && memberScheduleIds.Contains(s.ScheduleId)
                     && s.WeekStart >= weekStartMin
                     && s.WeekStart <= to)
            .ToListAsync();

        return shifts
            .Select(s => new { Shift = s, Date = s.WeekStart.AddDays(s.DayOfWeek) })
            .Where(x => x.Date >= from && x.Date <= to)
            .OrderBy(x => x.Date)
            .ThenBy(x => x.Shift.StartTime)
            .Select(x => new MyShiftDto
            {
                Date = x.Date.ToString("yyyy-MM-dd"),
                StartTime = x.Shift.StartTime.ToString("HH:mm"),
                EndTime = x.Shift.EndTime.ToString("HH:mm"),
                ShiftType = x.Shift.ShiftType,
                ScheduleId = x.Shift.ScheduleId.ToString(),
                ScheduleTitle = x.Shift.Schedule.Title,
                ScheduleIconBg = x.Shift.Schedule.IconBg
            })
            .ToList();
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
