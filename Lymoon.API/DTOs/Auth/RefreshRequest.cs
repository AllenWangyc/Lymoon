using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Auth;

public class RefreshRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
