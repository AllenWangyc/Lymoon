using System.Security.Claims;
using Lymoon.API.DTOs.Shifts;
using Lymoon.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Lymoon.API.Controllers;

[ApiController]
[Route("api/shifts")]
[Authorize]
public class ShiftsController : ControllerBase
{
    private readonly IShiftService _shiftService;

    public ShiftsController(IShiftService shiftService)
    {
        _shiftService = shiftService;
    }

    // GET /api/shifts/mine?from=2026-01-01&to=2026-12-31
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyShifts([FromQuery] string from, [FromQuery] string to)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (!DateOnly.TryParse(from, out var fromDate))
            return BadRequest(new { error = "Invalid 'from' date. Expected yyyy-MM-dd." });

        if (!DateOnly.TryParse(to, out var toDate))
            return BadRequest(new { error = "Invalid 'to' date. Expected yyyy-MM-dd." });

        if (fromDate > toDate)
            return BadRequest(new { error = "'from' must not be after 'to'." });

        var shifts = await _shiftService.GetMyShiftsAsync(userId, fromDate, toDate);
        return Ok(shifts);
    }

    // POST /api/shifts/{id}/update
    [HttpPost("{id:guid}/update")]
    public async Task<IActionResult> UpdateShift(Guid id, [FromBody] UpdateShiftRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var shift = await _shiftService.UpdateShiftAsync(id, userId, request);
            if (shift == null) return NotFound(new { error = "Shift not found." });
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

    // POST /api/shifts/{id}/delete
    [HttpPost("{id:guid}/delete")]
    public async Task<IActionResult> DeleteShift(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var deleted = await _shiftService.DeleteShiftAsync(id, userId);
            if (!deleted) return NotFound(new { error = "Shift not found." });
            return Ok(new { ok = true });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
    }

    private string? GetUserId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
}
