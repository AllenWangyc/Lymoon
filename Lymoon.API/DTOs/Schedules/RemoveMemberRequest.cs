using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Schedules;

public class RemoveMemberRequest
{
    [Required]
    public string UserId { get; set; } = string.Empty;
}
