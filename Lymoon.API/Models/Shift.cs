namespace Lymoon.API.Models;

public class Shift
{
    public Guid Id { get; set; }
    public Guid ScheduleId { get; set; }
    public string UserId { get; set; } = string.Empty;
    /// <summary>ISO Monday — which week this shift belongs to</summary>
    public DateOnly WeekStart { get; set; }
    /// <summary>0=Mon … 6=Sun</summary>
    public int DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    /// <summary>'Morning' | 'Standard' | 'Afternoon' | 'Custom'</summary>
    public string ShiftType { get; set; } = "Custom";

    public Schedule Schedule { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
