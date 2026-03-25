using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json.Serialization;
using Google.Apis.Auth;
using Lymoon.API.DTOs.Auth;
using Lymoon.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

namespace Lymoon.API.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;

    public AuthService(
        UserManager<AppUser> userManager,
        IJwtService jwtService,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        IMemoryCache cache)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _cache = cache;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing != null)
            throw new InvalidOperationException("email_taken");

        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException(errors);
        }

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
            ?? throw new UnauthorizedAccessException("invalid_credentials");

        var valid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!valid)
            throw new UnauthorizedAccessException("invalid_credentials");

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

        if (user == null)
            throw new UnauthorizedAccessException("invalid_refresh_token");

        if (user.RefreshTokenExpiry < DateTimeOffset.UtcNow)
            throw new UnauthorizedAccessException("refresh_token_expired");

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTimeOffset.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                DisplayName = user.DisplayName
            }
        };
    }

    public async Task<AuthResponse> GoogleSignInAsync(GoogleSignInRequest request)
    {
        var clientId = _configuration["GoogleClientId"]
            ?? throw new InvalidOperationException("GoogleClientId is not configured.");

        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);
        }
        catch (InvalidJwtException ex)
        {
            throw new UnauthorizedAccessException($"invalid_google_token: {ex.Message}");
        }

        var email = payload.Email;
        var displayName = payload.Name ?? email;

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            user = new AppUser
            {
                UserName = email,
                Email = email,
                DisplayName = displayName,
                EmailConfirmed = true
            };
            var result = await _userManager.CreateAsync(user, Guid.NewGuid().ToString());
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException(errors);
            }
        }

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> AppleSignInAsync(AppleSignInRequest request)
    {
        var bundleId = _configuration["AppleAppBundleId"]
            ?? throw new InvalidOperationException("AppleAppBundleId is not configured.");

        var jwks = await GetAppleJwksAsync();

        ClaimsPrincipal principal;
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = "https://appleid.apple.com",
                ValidateAudience = true,
                ValidAudience = bundleId,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = jwks
            };
            principal = handler.ValidateToken(request.IdToken, validationParameters, out _);
        }
        catch (SecurityTokenException ex)
        {
            throw new UnauthorizedAccessException($"invalid_apple_token: {ex.Message}");
        }

        var appleUserId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? principal.FindFirst("sub")?.Value
            ?? throw new UnauthorizedAccessException("apple_token_missing_sub");

        var email = principal.FindFirst(ClaimTypes.Email)?.Value
            ?? principal.FindFirst("email")?.Value;

        // Look up by AppleUserId first, then fall back to email
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.AppleUserId == appleUserId);

        if (user == null && email != null)
            user = await _userManager.FindByEmailAsync(email);

        if (user == null)
        {
            var displayName = email?.Split('@')[0] ?? "Apple User";
            user = new AppUser
            {
                UserName = email ?? appleUserId,
                Email = email,
                DisplayName = displayName,
                EmailConfirmed = true,
                AppleUserId = appleUserId
            };
            var result = await _userManager.CreateAsync(user, Guid.NewGuid().ToString());
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException(errors);
            }
        }
        else if (user.AppleUserId == null)
        {
            // Existing user found by email — link Apple ID for future lookups
            user.AppleUserId = appleUserId;
            await _userManager.UpdateAsync(user);
        }

        return await IssueTokensAsync(user);
    }

    private async Task<IList<JsonWebKey>> GetAppleJwksAsync()
    {
        const string cacheKey = "apple_jwks";
        if (_cache.TryGetValue(cacheKey, out IList<JsonWebKey>? cached) && cached != null)
            return cached;

        var client = _httpClientFactory.CreateClient();
        var jwksDoc = await client.GetFromJsonAsync<AppleJwksDocument>("https://appleid.apple.com/auth/keys")
            ?? throw new InvalidOperationException("Failed to fetch Apple JWKS.");

        var keys = jwksDoc.Keys
            .Select(k => new JsonWebKey
            {
                Kty = k.Kty,
                Kid = k.Kid,
                Use = k.Use,
                Alg = k.Alg,
                N = k.N,
                E = k.E
            })
            .ToList();

        _cache.Set(cacheKey, (IList<JsonWebKey>)keys, TimeSpan.FromHours(1));
        return keys;
    }

    private async Task<AuthResponse> IssueTokensAsync(AppUser user)
    {
        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTimeOffset.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                DisplayName = user.DisplayName
            }
        };
    }

    // Minimal POCO for deserializing Apple's JWKS response
    private sealed class AppleJwksDocument
    {
        [JsonPropertyName("keys")]
        public List<AppleJwk> Keys { get; set; } = new();
    }

    private sealed class AppleJwk
    {
        [JsonPropertyName("kty")] public string Kty { get; set; } = string.Empty;
        [JsonPropertyName("kid")] public string Kid { get; set; } = string.Empty;
        [JsonPropertyName("use")] public string Use { get; set; } = string.Empty;
        [JsonPropertyName("alg")] public string Alg { get; set; } = string.Empty;
        [JsonPropertyName("n")]   public string N { get; set; } = string.Empty;
        [JsonPropertyName("e")]   public string E { get; set; } = string.Empty;
    }
}
