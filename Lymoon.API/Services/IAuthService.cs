using Lymoon.API.DTOs.Auth;

namespace Lymoon.API.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshAsync(RefreshRequest request);
    Task<AuthResponse> GoogleSignInAsync(GoogleSignInRequest request);
    Task<AuthResponse> AppleSignInAsync(AppleSignInRequest request);
}
