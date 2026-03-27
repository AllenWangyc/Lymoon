using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Schedules;

public class CreateScheduleRequest
{
    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    /// <summary>'shift' | 'event' | 'personal'</summary>
    [Required]
    public string ScheduleType { get; set; } = string.Empty;

    /// <summary>ISO Monday date, e.g. "2026-03-16"</summary>
    [Required]
    public string StartWeek { get; set; } = string.Empty;

    /// <summary>'manager_only' | 'full_collaboration'</summary>
    [Required]
    public string MemberPermission { get; set; } = string.Empty;

    [Required]
    public string IconBg { get; set; } = string.Empty;
}
