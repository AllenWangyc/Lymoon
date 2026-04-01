using Lymoon.API.Data;
using Lymoon.API.DTOs.Schedules;
using Lymoon.API.Helpers;
using Lymoon.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Lymoon.API.Services;

public class ScheduleService : IScheduleService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notifications;

    public ScheduleService(AppDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<List<ScheduleItemDto>> GetUserSchedulesAsync(string userId)
    {
        var schedules = await _db.Schedules
            .Where(s => s.Members.Any(m => m.UserId == userId))
            .Include(s => s.Shifts)
            .ToListAsync();

        return schedules.Select(s => MapToItemDto(s, userId)).ToList();
    }

    public async Task<ScheduleItemDto> CreateScheduleAsync(string userId, CreateScheduleRequest request)
    {
        if (!DateOnly.TryParse(request.StartWeek, out var startWeek))
            throw new ArgumentException("Invalid startWeek format. Expected ISO date (yyyy-MM-dd).");

        string inviteCode;
        do
        {
            inviteCode = InviteCodeGenerator.Generate();
        } while (await _db.Schedules.AnyAsync(s => s.InviteCode == inviteCode));

        var schedule = new Schedule
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            ScheduleType = request.ScheduleType,
            MemberPermission = request.MemberPermission,
            InviteCode = inviteCode,
            IconBg = request.IconBg,
            StartWeek = startWeek,
            CurrentWeek = startWeek,
            CreatedById = userId
        };

        var member = new ScheduleMember
        {
            ScheduleId = schedule.Id,
            UserId = userId,
            Role = "Manager"
        };

        _db.Schedules.Add(schedule);
        _db.ScheduleMembers.Add(member);
        await _db.SaveChangesAsync();

        return MapToItemDto(schedule, userId);
    }

    public async Task<ScheduleDetailDto?> GetScheduleDetailAsync(Guid scheduleId, string userId, DateOnly? weekStart)
    {
        var membership = await _db.ScheduleMembers
            .FirstOrDefaultAsync(m => m.ScheduleId == scheduleId && m.UserId == userId);

        if (membership == null) return null;

        var schedule = await _db.Schedules
            .Include(s => s.Shifts)
            .FirstOrDefaultAsync(s => s.Id == scheduleId);

        if (schedule == null) return null;

        var resolvedWeek = weekStart ?? schedule.CurrentWeek;

        var members = await _db.ScheduleMembers
            .Where(m => m.ScheduleId == scheduleId)
            .Include(m => m.User)
            .ToListAsync();

        var weekShifts = schedule.Shifts.Where(s => s.WeekStart == resolvedWeek).ToList();
        var userShifts = weekShifts.Where(s => s.UserId == userId).ToList();

        var employees = members.Select(m => new EmployeeDto
        {
            Id = m.UserId,
            Name = m.User.DisplayName,
            Role = m.Role,
            AvatarInitials = AvatarHelper.GetInitials(m.User.DisplayName)
        }).ToList();

        var shifts = weekShifts.Select(s => new ShiftDto
        {
            Id = s.Id.ToString(),
            EmployeeId = s.UserId,
            DayOfWeek = s.DayOfWeek,
            StartTime = s.StartTime.ToString("HH:mm"),
            EndTime = s.EndTime.ToString("HH:mm"),
            ShiftType = s.ShiftType
        }).ToList();

        var detail = new ScheduleDetailDto
        {
            WeekStartDate = resolvedWeek.ToString("yyyy-MM-dd"),
            CurrentUserRole = membership.Role,
            Employees = employees,
            Shifts = shifts
        };

        // Populate base fields from ScheduleItemDto
        MapItemFields(detail, schedule, userId, userShifts);

        return detail;
    }

    public async Task<bool> RenameScheduleAsync(Guid scheduleId, string userId, string newTitle)
    {
        var membership = await _db.ScheduleMembers
            .FirstOrDefaultAsync(m => m.ScheduleId == scheduleId && m.UserId == userId);

        if (membership == null || membership.Role != "Manager") return false;

        var schedule = await _db.Schedules.FindAsync(scheduleId);
        if (schedule == null) return false;

        schedule.Title = newTitle;
        await _db.SaveChangesAsync();

        await _notifications.NotifyScheduleUpdatedAsync(scheduleId, newTitle);

        return true;
    }

    public async Task<LookupResponse> LookupByCodeAsync(string code, string userId)
    {
        var schedule = await _db.Schedules
            .Include(s => s.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(s => s.InviteCode == code.ToUpperInvariant());

        if (schedule == null)
            throw new KeyNotFoundException("invalid_code");

        if (schedule.Members.Any(m => m.UserId == userId))
            throw new InvalidOperationException("already_member");

        var manager = schedule.Members.FirstOrDefault(m => m.Role == "Manager");

        return new LookupResponse
        {
            ScheduleName = schedule.Title,
            ManagerName = manager?.User?.DisplayName ?? "Unknown",
            MemberCount = schedule.Members.Count
        };
    }

    public async Task<JoinResponse> JoinByCodeAsync(string code, string userId)
    {
        var schedule = await _db.Schedules
            .Include(s => s.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(s => s.InviteCode == code.ToUpperInvariant());

        if (schedule == null)
            throw new KeyNotFoundException("invalid_code");

        if (schedule.Members.Any(m => m.UserId == userId))
            throw new InvalidOperationException("already_member");

        _db.ScheduleMembers.Add(new ScheduleMember
        {
            ScheduleId = schedule.Id,
            UserId = userId,
            Role = "Member"
        });
        await _db.SaveChangesAsync();

        await _notifications.NotifyMemberJoinedAsync(schedule.Id, schedule.Title, userId);

        var manager = schedule.Members.FirstOrDefault(m => m.Role == "Manager");

        return new JoinResponse
        {
            Id = schedule.Id.ToString(),
            Title = schedule.Title,
            ManagerName = manager?.User?.DisplayName ?? "Unknown",
            MemberCount = schedule.Members.Count + 1  // include the newly added member
        };
    }

    public async Task LeaveScheduleAsync(Guid scheduleId, string userId)
    {
        var membership = await _db.ScheduleMembers
            .FirstOrDefaultAsync(m => m.ScheduleId == scheduleId && m.UserId == userId);

        if (membership == null)
            throw new KeyNotFoundException("not_a_member");

        if (membership.Role == "Manager")
        {
            var managerCount = await _db.ScheduleMembers
                .CountAsync(m => m.ScheduleId == scheduleId && m.Role == "Manager");
            if (managerCount <= 1)
                throw new InvalidOperationException("sole_manager");
        }

        _db.ScheduleMembers.Remove(membership);
        await _db.SaveChangesAsync();
    }

    public async Task<List<MemberDto>> GetMembersAsync(Guid scheduleId, string userId)
    {
        var requesterMembership = await _db.ScheduleMembers
            .FirstOrDefaultAsync(m => m.ScheduleId == scheduleId && m.UserId == userId);

        if (requesterMembership == null)
            throw new UnauthorizedAccessException("You are not a member of this schedule.");

        var members = await _db.ScheduleMembers
            .Where(m => m.ScheduleId == scheduleId)
            .Include(m => m.User)
            .ToListAsync();

        return members.Select(m => new MemberDto
        {
            Id = m.UserId,
            Name = m.User.DisplayName,
            Role = null,
            AvatarInitials = AvatarHelper.GetInitials(m.User.DisplayName),
            ScheduleRole = m.Role
        }).ToList();
    }

    public async Task RemoveMemberAsync(Guid scheduleId, string requesterId, string targetUserId)
    {
        var requesterMembership = await _db.ScheduleMembers
            .FirstOrDefaultAsync(m => m.ScheduleId == scheduleId && m.UserId == requesterId);

        if (requesterMembership == null)
            throw new KeyNotFoundException("Schedule not found.");

        if (requesterMembership.Role != "Manager")
            throw new UnauthorizedAccessException("Only a Manager can remove members.");

        var targetMembership = await _db.ScheduleMembers
            .FirstOrDefaultAsync(m => m.ScheduleId == scheduleId && m.UserId == targetUserId);

        if (targetMembership == null)
            throw new KeyNotFoundException("Member not found.");

        var schedule = await _db.Schedules.FindAsync(scheduleId)
            ?? throw new KeyNotFoundException("Schedule not found.");

        _db.ScheduleMembers.Remove(targetMembership);
        await _db.SaveChangesAsync();

        await _notifications.NotifyRemovedFromScheduleAsync(targetUserId, scheduleId, schedule.Title);
    }

    public async Task<DateOnly> AddNextWeekAsync(Guid scheduleId, string userId)
    {
        var membership = await _db.ScheduleMembers
            .FirstOrDefaultAsync(m => m.ScheduleId == scheduleId && m.UserId == userId);

        if (membership == null)
            throw new KeyNotFoundException("Schedule not found.");

        if (membership.Role != "Manager")
            throw new UnauthorizedAccessException("Only a Manager can add the next week.");

        var schedule = await _db.Schedules.FindAsync(scheduleId)
            ?? throw new KeyNotFoundException("Schedule not found.");

        schedule.CurrentWeek = schedule.CurrentWeek.AddDays(7);
        await _db.SaveChangesAsync();

        await _notifications.NotifyNewWeekAsync(schedule.Id, schedule.Title);

        return schedule.CurrentWeek;
    }

    public async Task<List<WorkHourWeekDto>> GetMemberWorkHoursAsync(Guid scheduleId, string requesterId, string targetUserId)
    {
        var requesterMembership = await _db.ScheduleMembers
            .FirstOrDefaultAsync(m => m.ScheduleId == scheduleId && m.UserId == requesterId);

        if (requesterMembership == null)
            throw new UnauthorizedAccessException("You are not a member of this schedule.");

        var schedule = await _db.Schedules.FindAsync(scheduleId)
            ?? throw new KeyNotFoundException("Schedule not found.");

        var weekStarts = Enumerable.Range(0, 4)
            .Select(i => schedule.CurrentWeek.AddDays(-7 * i))
            .ToList();

        var shifts = await _db.Shifts
            .Where(s => s.ScheduleId == scheduleId && s.UserId == targetUserId
                        && weekStarts.Contains(s.WeekStart))
            .ToListAsync();

        var result = weekStarts.Select(weekStart =>
        {
            var weekShifts = shifts.Where(s => s.WeekStart == weekStart).ToList();
            var minutes = weekShifts.Sum(s => (s.EndTime - s.StartTime).TotalMinutes);
            return new WorkHourWeekDto
            {
                WeekStart = weekStart.ToString("yyyy-MM-dd"),
                WeekEnd = weekStart.AddDays(6).ToString("yyyy-MM-dd"),
                TotalHours = FormatHours(minutes / 60.0)
            };
        }).ToList();

        return result;
    }

    // --- Private helpers ---

    private static ScheduleItemDto MapToItemDto(Schedule schedule, string userId)
    {
        var dto = new ScheduleItemDto();
        var userShifts = schedule.Shifts
            .Where(s => s.UserId == userId && s.WeekStart == schedule.CurrentWeek)
            .ToList();
        MapItemFields(dto, schedule, userId, userShifts);
        return dto;
    }

    private static void MapItemFields(ScheduleItemDto dto, Schedule schedule, string userId, List<Shift> userShifts)
    {
        dto.Id = schedule.Id.ToString();
        dto.Title = schedule.Title;
        dto.IconBg = schedule.IconBg;
        dto.ScheduleType = schedule.ScheduleType;
        dto.MemberPermission = schedule.MemberPermission;
        dto.StartWeek = schedule.StartWeek.ToString("yyyy-MM-dd");
        dto.CurrentWeek = schedule.CurrentWeek.ToString("yyyy-MM-dd");
        dto.Description = schedule.Description;
        dto.InviteCode = schedule.InviteCode;
        dto.Hours = ComputeHours(userShifts);
        dto.Days = ComputeDays(userShifts, schedule.CurrentWeek);
    }

    private static string ComputeHours(List<Shift> shifts)
    {
        var totalMinutes = shifts.Sum(s => (s.EndTime - s.StartTime).TotalMinutes);
        return FormatHours(totalMinutes / 60.0);
    }

    private static string FormatHours(double hours)
    {
        if (hours == 0) return "0";
        return hours == Math.Floor(hours)
            ? ((int)hours).ToString()
            : hours.ToString("0.#");
    }

    private static List<DayDto> ComputeDays(List<Shift> userShifts, DateOnly weekStart)
    {
        var dayNames = new[] { "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su" };
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        return Enumerable.Range(0, 7).Select(i =>
        {
            var dailyMinutes = userShifts
                .Where(s => s.DayOfWeek == i)
                .Sum(s => (s.EndTime - s.StartTime).TotalMinutes);
            var dailyHours = dailyMinutes / 60.0;
            var opacity = dailyMinutes == 0
                ? 0.0
                : Math.Min(1.0, 0.3 + dailyHours / 8.0 * 0.7);
            var isToday = weekStart.AddDays(i) == today;
            return new DayDto(dayNames[i], Math.Round(opacity, 4), isToday);
        }).ToList();
    }
}
