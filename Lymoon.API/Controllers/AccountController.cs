using System.Security.Claims;
using Lymoon.API.DTOs.Account;
using Lymoon.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lymoon.API.Controllers;

[ApiController]
[Route("api/account")]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;

    public AccountController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    // PATCH /api/account/display-name
    [HttpPatch("display-name")]
    public async Task<IActionResult> UpdateDisplayName([FromBody] UpdateDisplayNameRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        try
        {
            var newName = await _accountService.UpdateDisplayNameAsync(userId, request.DisplayName);
            return Ok(new { displayName = newName });
        }
        catch (InvalidOperationException ex) when (ex.Message is "display_name_empty" or "display_name_too_long")
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // DELETE /api/account
    [HttpDelete]
    public async Task<IActionResult> DeleteAccount()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        try
        {
            await _accountService.DeleteAccountAsync(userId);
            return Ok(new { });
        }
        catch (SoleManagerBlockingException ex)
        {
            return Conflict(new { error = "sole_manager_blocking", schedules = ex.Schedules });
        }
    }
}
