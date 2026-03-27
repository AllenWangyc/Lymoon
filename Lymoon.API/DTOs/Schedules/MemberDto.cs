namespace Lymoon.API.DTOs.Schedules;

public class MemberDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    /// <summary>Job title — null until that feature is added to AppUser.</summary>
    public string? Role { get; set; }
    public string AvatarInitials { get; set; } = string.Empty;
    /// <summary>"Manager" | "Member"</summary>
    public string ScheduleRole { get; set; } = string.Empty;
}
