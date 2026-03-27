namespace Lymoon.API.DTOs.Schedules;

public class ScheduleItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    /// <summary>Total hours for the current user in currentWeek, e.g. "38.5"</summary>
    public string Hours { get; set; } = "0";
    public string IconBg { get; set; } = string.Empty;
    public List<DayDto> Days { get; set; } = new();
    public string ScheduleType { get; set; } = string.Empty;
    public string MemberPermission { get; set; } = string.Empty;
    public string StartWeek { get; set; } = string.Empty;
    public string CurrentWeek { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string InviteCode { get; set; } = string.Empty;
}
