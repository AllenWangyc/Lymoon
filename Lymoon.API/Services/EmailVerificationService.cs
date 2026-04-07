using Microsoft.Extensions.Caching.Memory;

namespace Lymoon.API.Services;

public class EmailVerificationService : IEmailVerificationService
{
    private readonly IMemoryCache _cache;
    private const int CodeExpiryMinutes = 10;
    private const int CooldownSeconds = 60;
    private const int MaxAttempts = 5;

    public EmailVerificationService(IMemoryCache cache)
    {
        _cache = cache;
    }

    private static string CodeKey(string email) => $"ev_code:{email.ToLowerInvariant()}";
    private static string AttemptsKey(string email) => $"ev_attempts:{email.ToLowerInvariant()}";
    private static string CooldownKey(string email) => $"ev_cooldown:{email.ToLowerInvariant()}";

    public string GenerateCode(string email)
    {
        if (_cache.TryGetValue(CooldownKey(email), out _))
            throw new InvalidOperationException("rate_limited");

        var code = Random.Shared.Next(100000, 999999).ToString();
        var expiry = TimeSpan.FromMinutes(CodeExpiryMinutes);

        _cache.Set(CodeKey(email), code, expiry);
        _cache.Set(AttemptsKey(email), 0, expiry);
        _cache.Set(CooldownKey(email), true, TimeSpan.FromSeconds(CooldownSeconds));

        return code;
    }

    public void VerifyCode(string email, string code)
    {
        var attemptsKey = AttemptsKey(email);
        var attempts = _cache.GetOrCreate(attemptsKey, e =>
        {
            e.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CodeExpiryMinutes);
            return 0;
        });

        if (attempts >= MaxAttempts)
            throw new InvalidOperationException("too_many_attempts");

        if (!_cache.TryGetValue(CodeKey(email), out string? storedCode))
            throw new InvalidOperationException("code_expired");

        if (storedCode != code)
        {
            _cache.Set(attemptsKey, attempts + 1, TimeSpan.FromMinutes(CodeExpiryMinutes));
            throw new InvalidOperationException("invalid_code");
        }

        _cache.Remove(CodeKey(email));
        _cache.Remove(AttemptsKey(email));
        _cache.Remove(CooldownKey(email));
    }
}
