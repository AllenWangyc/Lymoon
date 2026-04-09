using Lymoon.API.DTOs.Shifts;

namespace Lymoon.API.Services;

public interface IShiftService
{
    /// <summary>
    /// Add a shift to a schedule's current week.
    /// Returns null if requester is not a member.
    /// Throws UnauthorizedAccessException if requester lacks permission.
    /// Throws ArgumentException on invalid input.
    /// </summary>
    Task<ShiftDto?> AddShiftAsync(Guid scheduleId, string requesterId, AddShiftRequest request);

    /// <summary>
    /// Update an existing shift's time and type.
    /// Returns null if shift not found.
    /// Throws UnauthorizedAccessException if requester lacks permission.
    /// Throws ArgumentException on invalid input.
    /// </summary>
    Task<ShiftDto?> UpdateShiftAsync(Guid shiftId, string requesterId, UpdateShiftRequest request);

    /// <summary>
    /// Delete a shift.
    /// Returns false if shift not found.
    /// Throws UnauthorizedAccessException if requester lacks permission.
    /// </summary>
    Task<bool> DeleteShiftAsync(Guid shiftId, string requesterId);

    /// <summary>
    /// Returns all shifts belonging to the requester across all their schedules,
    /// filtered to those whose computed date falls within [from, to] inclusive.
    /// </summary>
    Task<List<MyShiftDto>> GetMyShiftsAsync(string requesterId, DateOnly from, DateOnly to);
}
