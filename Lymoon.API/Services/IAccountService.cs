namespace Lymoon.API.Services;

public interface IAccountService
{
    Task<string> UpdateDisplayNameAsync(string userId, string displayName);
    Task DeleteAccountAsync(string userId);
}
