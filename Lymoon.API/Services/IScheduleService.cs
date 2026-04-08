using Lymoon.API.DTOs.Schedules;

namespace Lymoon.API.Services;

public interface IScheduleService
{
    Task<List<ScheduleItemDto>> GetUserSchedulesAsync(string userId);
    Task<ScheduleItemDto> CreateScheduleAsync(string userId, CreateScheduleRequest request);
    Task<ScheduleDetailDto?> GetScheduleDetailAsync(Guid scheduleId, string userId, DateOnly? weekStart);
    Task<bool> RenameScheduleAsync(Guid scheduleId, string userId, string newTitle);

    // Step 4 — Membership & Week Navigation
    /// <exception cref="KeyNotFoundException">Invite code not found.</exception>
    /// <exception cref="InvalidOperationException">Already a member (message: "already_member").</exception>
    Task<LookupResponse> LookupByCodeAsync(string code, string userId);

    /// <exception cref="KeyNotFoundException">Invite code not found.</exception>
    /// <exception cref="InvalidOperationException">Already a member (message: "already_member").</exception>
    Task<JoinResponse> JoinByCodeAsync(string code, string userId);

    /// <exception cref="KeyNotFoundException">User is not a member of this schedule.</exception>
    /// <exception cref="InvalidOperationException">User is the sole manager (message: "sole_manager").</exception>
    Task LeaveScheduleAsync(Guid scheduleId, string userId);

    /// <exception cref="UnauthorizedAccessException">Requester is not a member of this schedule.</exception>
    Task<List<MemberDto>> GetMembersAsync(Guid scheduleId, string userId);

    /// <exception cref="KeyNotFoundException">Requester or target not found in this schedule.</exception>
    /// <exception cref="UnauthorizedAccessException">Requester is not a Manager.</exception>
    Task RemoveMemberAsync(Guid scheduleId, string requesterId, string targetUserId);

    /// <exception cref="KeyNotFoundException">Requester is not a member of this schedule.</exception>
    /// <exception cref="UnauthorizedAccessException">Requester is not a Manager.</exception>
    Task<DateOnly> AddNextWeekAsync(Guid scheduleId, string userId);

    // Step 6 — Work Hours
    /// <exception cref="UnauthorizedAccessException">Requester is not a member of this schedule.</exception>
    Task<List<WorkHourWeekDto>> GetMemberWorkHoursAsync(Guid scheduleId, string requesterId, string targetUserId);

    /// <exception cref="KeyNotFoundException">Schedule not found.</exception>
    /// <exception cref="UnauthorizedAccessException">Requester is not a Manager.</exception>
    Task DissolveScheduleAsync(Guid scheduleId, string requesterId);

    /// <exception cref="KeyNotFoundException">Target member not found (message: "member_not_found").</exception>
    /// <exception cref="InvalidOperationException">Target is already a Manager (message: "target_is_already_manager").</exception>
    /// <exception cref="UnauthorizedAccessException">Requester is not a Manager.</exception>
    Task TransferManagerAsync(Guid scheduleId, string requesterId, string targetUserId);
}
