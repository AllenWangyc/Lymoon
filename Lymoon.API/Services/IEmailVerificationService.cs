namespace Lymoon.API.Services;

public interface IEmailVerificationService
{
    /// <summary>
    /// Generates a 6-digit code, stores it in cache, and returns it.
    /// Throws InvalidOperationException("rate_limited") if a code was sent within 60 seconds.
    /// </summary>
    string GenerateCode(string email);

    /// <summary>
    /// Verifies the code for the email.
    /// Throws InvalidOperationException("code_expired") if no code exists.
    /// Throws InvalidOperationException("invalid_code") if code doesn't match.
    /// Throws InvalidOperationException("too_many_attempts") after 5 wrong attempts.
    /// Removes the code from cache on success.
    /// </summary>
    void VerifyCode(string email, string code);
}
