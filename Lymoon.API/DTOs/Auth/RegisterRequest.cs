using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Auth;

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string VerificationCode { get; set; } = string.Empty;
}
