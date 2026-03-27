using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Schedules;

public class RenameRequest
{
    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;
}
