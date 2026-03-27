using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Notifications;

public class MarkReadRequest
{
    [Required]
    public List<string> NotificationIds { get; set; } = new();
}
