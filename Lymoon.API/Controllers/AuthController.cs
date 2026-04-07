using Lymoon.API.DTOs.Auth;
using Lymoon.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Lymoon.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IEmailService _emailService;
    private readonly IEmailVerificationService _verificationService;

    public AuthController(
        IAuthService authService,
        IEmailService emailService,
        IEmailVerificationService verificationService)
    {
        _authService = authService;
        _emailService = emailService;
        _verificationService = verificationService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex) when (
            ex.Message is "code_expired" or "invalid_code" or "too_many_attempts")
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("send-verification")]
    public async Task<IActionResult> SendVerification([FromBody] SendVerificationRequest request)
    {
        try
        {
            var code = _verificationService.GenerateCode(request.Email);
            await _emailService.SendVerificationCodeAsync(request.Email, code);
            return Ok(new { ok = true });
        }
        catch (InvalidOperationException ex) when (ex.Message == "rate_limited")
        {
            return StatusCode(429, new { error = "rate_limited" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { error = "Failed to send verification email." });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        try
        {
            var response = await _authService.RefreshAsync(request);
            return Ok(new { response.AccessToken, response.RefreshToken });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleSignIn([FromBody] GoogleSignInRequest request)
    {
        try
        {
            var response = await _authService.GoogleSignInAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("apple")]
    public async Task<IActionResult> AppleSignIn([FromBody] AppleSignInRequest request)
    {
        try
        {
            var response = await _authService.AppleSignInAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
