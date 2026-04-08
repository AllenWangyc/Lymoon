using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Schedules;

public class TransferManagerRequest
{
    [Required]
    public string UserId { get; set; } = string.Empty;
}
