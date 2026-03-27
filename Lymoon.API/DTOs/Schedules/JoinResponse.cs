namespace Lymoon.API.DTOs.Schedules;

public class JoinResponse
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ManagerName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
}
