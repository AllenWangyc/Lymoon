using System.Security.Claims;
using Lymoon.API.DTOs.Schedules;
using Lymoon.API.DTOs.Shifts;
using Lymoon.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lymoon.API.Controllers;

[ApiController]
[Route("api/schedules")]
[Authorize]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _scheduleService;
    private readonly IShiftService _shiftService;

    public SchedulesController(IScheduleService scheduleService, IShiftService shiftService)
    {
        _scheduleService = scheduleService;
        _shiftService = shiftService;
    }

    // GET /api/schedules
    [HttpGet]
    public async Task<IActionResult> GetUserSchedules()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var schedules = await _scheduleService.GetUserSchedulesAsync(userId);
        return Ok(schedules);
    }

    // POST /api/schedules
    [HttpPost]
    public async Task<IActionResult> CreateSchedule([FromBody] CreateScheduleRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var schedule = await _scheduleService.CreateScheduleAsync(userId, request);
            return Ok(schedule);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // GET /api/schedules/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetScheduleDetail(Guid id, [FromQuery] string? weekStart)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        DateOnly? parsedWeek = null;
        if (!string.IsNullOrEmpty(weekStart))
        {
            if (!DateOnly.TryParse(weekStart, out var parsed))
                return BadRequest(new { error = "Invalid weekStart format. Expected yyyy-MM-dd." });
            parsedWeek = parsed;
        }

        var detail = await _scheduleService.GetScheduleDetailAsync(id, userId, parsedWeek);
        if (detail == null) return StatusCode(403, new { error = "You are not a member of this schedule." });

        return Ok(detail);
    }

    // POST /api/schedules/{id}/rename
    [HttpPost("{id:guid}/rename")]
    public async Task<IActionResult> RenameSchedule(Guid id, [FromBody] RenameRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var success = await _scheduleService.RenameScheduleAsync(id, userId, request.Title);
        if (!success) return StatusCode(403, new { error = "Only a Manager can rename this schedule." });

        return Ok(new { ok = true });
    }

    // POST /api/schedules/{id}/shifts
    [HttpPost("{id:guid}/shifts")]
    public async Task<IActionResult> AddShift(Guid id, [FromBody] AddShiftRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var shift = await _shiftService.AddShiftAsync(id, userId, request);
            if (shift == null) return StatusCode(403, new { error = "You are not a member of this schedule." });
            return Ok(shift);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // GET /api/schedules/lookup?code={inviteCode}
    // Declared as a literal segment so ASP.NET Core resolves it before {id:guid}.
    [HttpGet("lookup")]
    public async Task<IActionResult> LookupByCode([FromQuery] string? code)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(code))
            return BadRequest(new { error = "code is required." });

        try
        {
            var result = await _scheduleService.LookupByCodeAsync(code, userId);
            return Ok(result);
        }
        catch (Exception ex) when (ex is KeyNotFoundException or InvalidOperationException)
        {
            return HandleDomainException(ex);
        }
    }

    // POST /api/schedules/join
    [HttpPost("join")]
    public async Task<IActionResult> JoinByCode([FromBody] JoinRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var result = await _scheduleService.JoinByCodeAsync(request.InviteCode, userId);
            return Ok(result);
        }
        catch (Exception ex) when (ex is KeyNotFoundException or InvalidOperationException)
        {
            return HandleDomainException(ex);
        }
    }

    // POST /api/schedules/{id}/leave
    [HttpPost("{id:guid}/leave")]
    public async Task<IActionResult> LeaveSchedule(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            await _scheduleService.LeaveScheduleAsync(id, userId);
            return Ok(new { ok = true });
        }
        catch (Exception ex) when (ex is KeyNotFoundException or InvalidOperationException)
        {
            return HandleDomainException(ex);
        }
    }

    // GET /api/schedules/{id}/members
    [HttpGet("{id:guid}/members")]
    public async Task<IActionResult> GetMembers(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var members = await _scheduleService.GetMembersAsync(id, userId);
            return Ok(members);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
    }

    // POST /api/schedules/{id}/members/remove
    [HttpPost("{id:guid}/members/remove")]
    public async Task<IActionResult> RemoveMember(Guid id, [FromBody] RemoveMemberRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            await _scheduleService.RemoveMemberAsync(id, userId, request.UserId);
            return Ok(new { ok = true });
        }
        catch (Exception ex) when (ex is KeyNotFoundException or InvalidOperationException or UnauthorizedAccessException)
        {
            return HandleDomainException(ex);
        }
    }

    // DELETE /api/schedules/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DissolveSchedule(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            await _scheduleService.DissolveScheduleAsync(id, userId);
            return Ok(new { ok = true });
        }
        catch (Exception ex) when (ex is KeyNotFoundException or UnauthorizedAccessException)
        {
            return HandleDomainException(ex);
        }
    }

    // POST /api/schedules/{id}/members/transfer-manager
    [HttpPost("{id:guid}/members/transfer-manager")]
    public async Task<IActionResult> TransferManager(Guid id, [FromBody] TransferManagerRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            await _scheduleService.TransferManagerAsync(id, userId, request.UserId);
            return Ok(new { ok = true });
        }
        catch (Exception ex) when (ex is KeyNotFoundException or InvalidOperationException or UnauthorizedAccessException)
        {
            return HandleDomainException(ex);
        }
    }

    // POST /api/schedules/{id}/weeks
    [HttpPost("{id:guid}/weeks")]
    public async Task<IActionResult> AddNextWeek(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var newWeek = await _scheduleService.AddNextWeekAsync(id, userId);
            return Ok(new { currentWeek = newWeek.ToString("yyyy-MM-dd") });
        }
        catch (Exception ex) when (ex is KeyNotFoundException or InvalidOperationException or UnauthorizedAccessException)
        {
            return HandleDomainException(ex);
        }
    }

    // GET /api/schedules/{id}/members/{userId}/work-hours
    [HttpGet("{id:guid}/members/{userId}/work-hours")]
    public async Task<IActionResult> GetMemberWorkHours(Guid id, string userId)
    {
        var requesterId = GetUserId();
        if (requesterId == null) return Unauthorized();

        try
        {
            var result = await _scheduleService.GetMemberWorkHoursAsync(id, requesterId, userId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    private string? GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    private IActionResult HandleDomainException(Exception ex) => ex switch
    {
        KeyNotFoundException kex => NotFound(new { error = kex.Message }),
        InvalidOperationException iex => Conflict(new { error = iex.Message }),
        UnauthorizedAccessException uax => StatusCode(403, new { error = uax.Message }),
        _ => throw ex
    };
}
