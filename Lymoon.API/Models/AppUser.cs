using Microsoft.AspNetCore.Identity;

namespace Lymoon.API.Models;

public class AppUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
}
