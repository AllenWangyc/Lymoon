using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Shifts;

public class UpdateShiftRequest
{
    /// <summary>Format: "HH:mm"</summary>
    [Required]
    public string StartTime { get; set; } = string.Empty;

    /// <summary>Format: "HH:mm"</summary>
    [Required]
    public string EndTime { get; set; } = string.Empty;

    /// <summary>'Morning' | 'Standard' | 'Afternoon' | 'Custom'</summary>
    public string ShiftType { get; set; } = "Custom";
}
