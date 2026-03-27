using Lymoon.API.Data;
using Lymoon.API.DTOs.Notifications;
using Lymoon.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Lymoon.API.Services;

public class NotificationService : INotificationService
{
    private static readonly string[] DayNames =
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    private readonly AppDbContext _db;

    public NotificationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<NotificationDto>> GetNotificationsAsync(string userId)
    {
        var notifications = await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return notifications.Select(MapToDto).ToList();
    }

    public async Task MarkReadAsync(string userId, List<string> notificationIds)
    {
        var ids = notificationIds
            .Where(id => Guid.TryParse(id, out _))
            .Select(Guid.Parse)
            .ToHashSet();

        var notifications = await _db.Notifications
            .Where(n => n.UserId == userId && ids.Contains(n.Id))
            .ToListAsync();

        foreach (var notification in notifications)
            notification.IsRead = true;

        await _db.SaveChangesAsync();
    }

    public async Task NotifyShiftModifiedAsync(Shift shift, string actorId)
    {
        if (shift.UserId == actorId) return;

        var actorName = await GetDisplayNameAsync(actorId);
        var dayName = DayNames[shift.DayOfWeek];

        _db.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = shift.UserId,
            ScheduleId = shift.ScheduleId,
            Type = "shift_modified",
            Message = $"{actorName} updated your shift on {dayName}"
        });

        await _db.SaveChangesAsync();
    }

    public async Task NotifyShiftDeletedAsync(Shift shift, string actorId)
    {
        if (shift.UserId == actorId) return;

        var actorName = await GetDisplayNameAsync(actorId);
        var dayName = DayNames[shift.DayOfWeek];

        _db.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = shift.UserId,
            ScheduleId = shift.ScheduleId,
            Type = "shift_deleted",
            Message = $"{actorName} removed your shift on {dayName}"
        });

        await _db.SaveChangesAsync();
    }

    public async Task NotifyNewWeekAsync(Guid scheduleId, string scheduleName)
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
            Type = "new_week_added",
            Message = $"A new week has been added to {scheduleName}"
        });

        _db.Notifications.AddRange(notifications);
        await _db.SaveChangesAsync();
    }

    public async Task NotifyRemovedFromScheduleAsync(string userId, Guid scheduleId, string scheduleName)
    {
        _db.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ScheduleId = scheduleId,
            Type = "removed_from_schedule",
            Message = $"You have been removed from {scheduleName}"
        });

        await _db.SaveChangesAsync();
    }

    private async Task<string> GetDisplayNameAsync(string userId)
    {
        var name = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.DisplayName)
            .FirstOrDefaultAsync();
        return name ?? "Someone";
    }

    private static NotificationDto MapToDto(Notification n) => new()
    {
        Id = n.Id.ToString(),
        Type = n.Type,
        Message = n.Message,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt
    };
}
