namespace Lymoon.API.DTOs.Schedules;

public class LookupResponse
{
    public string ScheduleName { get; set; } = string.Empty;
    public string ManagerName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
}
