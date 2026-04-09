using Lymoon.API.Data;
using Lymoon.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Lymoon.API.Services;

public class AccountService : IAccountService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _context;

    public AccountService(UserManager<AppUser> userManager, AppDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    public async Task<string> UpdateDisplayNameAsync(string userId, string displayName)
    {
        var trimmed = displayName.Trim();

        if (trimmed.Length == 0)
            throw new InvalidOperationException("display_name_empty");

        if (trimmed.Length > 50)
            throw new InvalidOperationException("display_name_too_long");

        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new InvalidOperationException("user_not_found");

        user.DisplayName = trimmed;
        await _userManager.UpdateAsync(user);

        return trimmed;
    }

    public async Task DeleteAccountAsync(string userId)
    {
        // Check for sole-manager schedules before touching data
        var soloManagedIds = await _context.ScheduleMembers
            .Where(m => m.UserId == userId && m.Role == "Manager")
            .Where(m => !_context.ScheduleMembers.Any(
                o => o.ScheduleId == m.ScheduleId && o.UserId != userId && o.Role == "Manager"))
            .Select(m => m.ScheduleId)
            .ToListAsync();

        if (soloManagedIds.Count > 0)
        {
            var blockingTitles = await _context.Schedules
                .Where(s => soloManagedIds.Contains(s.Id))
                .Select(s => s.Title)
                .ToListAsync();
            throw new SoleManagerBlockingException(blockingTitles);
        }

        // Hard delete inside a transaction
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            await _context.Shifts
                .Where(s => s.UserId == userId)
                .ExecuteDeleteAsync();

            await _context.Notifications
                .Where(n => n.UserId == userId)
                .ExecuteDeleteAsync();

            await _context.ScheduleMembers
                .Where(m => m.UserId == userId)
                .ExecuteDeleteAsync();

            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new InvalidOperationException("user_not_found");
            var deleteResult = await _userManager.DeleteAsync(user);
            if (!deleteResult.Succeeded)
                throw new InvalidOperationException(
                    string.Join("; ", deleteResult.Errors.Select(e => e.Description)));

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}

public class SoleManagerBlockingException : Exception
{
    public List<string> Schedules { get; }
    public SoleManagerBlockingException(List<string> schedules)
        : base("sole_manager_blocking")
    {
        Schedules = schedules;
    }
}
