namespace Lymoon.API.Services;

public interface IEmailService
{
    Task SendVerificationCodeAsync(string toEmail, string code);
}
