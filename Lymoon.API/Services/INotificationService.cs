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
}
