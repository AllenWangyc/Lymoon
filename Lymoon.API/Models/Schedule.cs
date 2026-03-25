namespace Lymoon.API.Models;

public class Schedule
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    /// <summary>'shift' | 'event' | 'personal'</summary>
    public string ScheduleType { get; set; } = string.Empty;
    /// <summary>'manager_only' | 'full_collaboration'</summary>
    public string MemberPermission { get; set; } = string.Empty;
    /// <summary>6-character uppercase alphanumeric, unique</summary>
    public string InviteCode { get; set; } = string.Empty;
    public string IconBg { get; set; } = string.Empty;
    /// <summary>ISO Monday — week the schedule was created for</summary>
    public DateOnly StartWeek { get; set; }
    /// <summary>ISO Monday — latest active week (advances forward only)</summary>
    public DateOnly CurrentWeek { get; set; }
    public string CreatedById { get; set; } = string.Empty;

    public AppUser CreatedBy { get; set; } = null!;
    public ICollection<ScheduleMember> Members { get; set; } = new List<ScheduleMember>();
    public ICollection<Shift> Shifts { get; set; } = new List<Shift>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
