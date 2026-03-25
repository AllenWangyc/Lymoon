using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Auth;

public class GoogleSignInRequest
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}
