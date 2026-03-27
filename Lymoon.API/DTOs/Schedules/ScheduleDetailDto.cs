namespace Lymoon.API.DTOs.Schedules;

public class ScheduleDetailDto : ScheduleItemDto
{
    /// <summary>The ISO Monday date whose shifts are returned in this response</summary>
    public string WeekStartDate { get; set; } = string.Empty;
    /// <summary>'Manager' | 'Member'</summary>
    public string CurrentUserRole { get; set; } = string.Empty;
    public List<EmployeeDto> Employees { get; set; } = new();
    public List<ShiftDto> Shifts { get; set; } = new();
}
