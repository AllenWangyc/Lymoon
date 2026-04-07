using Lymoon.API.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Lymoon.API.Services;

public class EmailService : IEmailService
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<SmtpSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendVerificationCodeAsync(string toEmail, string code)
    {
        if (_settings.UseConsoleLogger)
        {
            _logger.LogInformation("[DEV] Verification code for {Email}: {Code}", toEmail, code);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = $"{code} is your Lymoon verification code";

        message.Body = new TextPart("html")
        {
            Text = $"""
                <!DOCTYPE html>
                <html>
                <body style="margin:0;padding:0;background:#f8f8f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
                    <tr><td align="center">
                      <table width="420" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;padding:40px;border:1px solid #e2e8f0;">
                        <tr><td>
                          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;">Lymoon</p>
                          <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">Verify your email</h2>
                          <p style="margin:0 0 24px;font-size:15px;color:#64748b;">Use the code below to complete your registration. It expires in 10 minutes.</p>
                          <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                            <span style="font-size:36px;font-weight:700;color:#0f172a;letter-spacing:10px;">{code}</span>
                          </div>
                          <p style="margin:0;font-size:13px;color:#94a3b8;">If you didn't request this code, you can safely ignore this email.</p>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(_settings.Host, _settings.Port,
            _settings.UseSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable);
        await client.AuthenticateAsync(_settings.Username, _settings.Password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
