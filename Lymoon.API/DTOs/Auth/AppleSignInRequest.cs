using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Auth;

public class AppleSignInRequest
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}
