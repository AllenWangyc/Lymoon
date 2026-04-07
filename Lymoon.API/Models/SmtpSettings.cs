namespace Lymoon.API.Models;

public class SmtpSettings
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = false;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromEmail { get; set; } = "";
    public string FromName { get; set; } = "Lymoon";
    /// <summary>
    /// When true, prints the code to the console instead of sending an email.
    /// Set to true in development.
    /// </summary>
    public bool UseConsoleLogger { get; set; } = false;
}
