using System.Security.Claims;
using Lymoon.API.DTOs.Notifications;
using Lymoon.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lymoon.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    // GET /api/notifications
    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var notifications = await _notificationService.GetNotificationsAsync(userId);
        return Ok(notifications);
    }

    // POST /api/notifications/read
    [HttpPost("read")]
    public async Task<IActionResult> MarkRead([FromBody] MarkReadRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        await _notificationService.MarkReadAsync(userId, request.NotificationIds);
        return Ok(new { ok = true });
    }

    // DELETE /api/notifications
    [HttpDelete]
    public async Task<IActionResult> DeleteAll()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        await _notificationService.DeleteAllAsync(userId);
        return NoContent();
    }

    private string? GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
}
