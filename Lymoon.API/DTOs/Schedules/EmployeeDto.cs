namespace Lymoon.API.DTOs.Schedules;

public class EmployeeDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    /// <summary>Schedule role: 'Manager' | 'Member'</summary>
    public string Role { get; set; } = string.Empty;
    public string AvatarInitials { get; set; } = string.Empty;
}
