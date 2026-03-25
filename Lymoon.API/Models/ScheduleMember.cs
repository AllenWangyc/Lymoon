namespace Lymoon.API.Models;

public class ScheduleMember
{
    public Guid ScheduleId { get; set; }
    public string UserId { get; set; } = string.Empty;
    /// <summary>'Manager' | 'Member'</summary>
    public string Role { get; set; } = string.Empty;

    public Schedule Schedule { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
