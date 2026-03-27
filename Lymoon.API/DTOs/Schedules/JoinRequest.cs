using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Schedules;

public class JoinRequest
{
    [Required]
    public string InviteCode { get; set; } = string.Empty;
}
