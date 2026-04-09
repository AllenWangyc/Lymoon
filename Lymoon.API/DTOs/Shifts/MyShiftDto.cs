namespace Lymoon.API.DTOs.Shifts;

public class MyShiftDto
{
    /// <summary>ISO date string: "2026-03-16"</summary>
    public string Date { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string ShiftType { get; set; } = string.Empty;
    public string ScheduleId { get; set; } = string.Empty;
    public string ScheduleTitle { get; set; } = string.Empty;
    public string ScheduleIconBg { get; set; } = string.Empty;
}
