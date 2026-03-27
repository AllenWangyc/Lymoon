namespace Lymoon.API.DTOs.Schedules;

public class ShiftDto
{
    public string Id { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    /// <summary>0 = Mon … 6 = Sun</summary>
    public int DayOfWeek { get; set; }
    /// <summary>Format: "HH:mm"</summary>
    public string StartTime { get; set; } = string.Empty;
    /// <summary>Format: "HH:mm"</summary>
    public string EndTime { get; set; } = string.Empty;
    /// <summary>'Morning' | 'Standard' | 'Afternoon' | 'Custom'</summary>
    public string ShiftType { get; set; } = string.Empty;
}
