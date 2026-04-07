using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Auth;

public class SendVerificationRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = "";
}
