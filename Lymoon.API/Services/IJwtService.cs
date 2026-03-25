using Lymoon.API.Models;

namespace Lymoon.API.Services;

public interface IJwtService
{
    string GenerateAccessToken(AppUser user);
    string GenerateRefreshToken();
}
