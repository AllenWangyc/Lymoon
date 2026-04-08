# Email Verification on Register Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email OTP verification to the registration flow — user enters email, clicks "Send", receives a 6-digit code, enters it in the form, then completes registration.

**Architecture:** Backend generates and stores a 6-digit OTP in `IMemoryCache` (already registered) with a 10-minute TTL. A new `POST /api/auth/send-verification` endpoint handles sending the code via SMTP (MailKit). The existing `POST /api/auth/register` is extended to accept and verify the code before creating the account. Frontend adds a "Send" button inline with the email field, a countdown timer for resend, and a verification code input that appears after sending.

**Tech Stack:** .NET 8 / MailKit (SMTP) / IMemoryCache (OTP storage) / Expo React Native / NativeWind / TanStack Query v5

---

## File Map

**Backend — new:**
- `Lymoon.API/Models/SmtpSettings.cs` — SMTP config model
- `Lymoon.API/Services/IEmailService.cs` — send email interface
- `Lymoon.API/Services/EmailService.cs` — MailKit SMTP implementation
- `Lymoon.API/Services/IEmailVerificationService.cs` — OTP generate/verify interface
- `Lymoon.API/Services/EmailVerificationService.cs` — IMemoryCache-backed OTP logic
- `Lymoon.API/DTOs/Auth/SendVerificationRequest.cs` — request DTO

**Backend — modified:**
- `Lymoon.API/Lymoon.API.csproj` — add `<PackageReference Include="MailKit" Version="4.*" />`
- `Lymoon.API/appsettings.json` — add `SmtpSettings` section
- `Lymoon.API/Program.cs` — register IEmailService + IEmailVerificationService
- `Lymoon.API/Controllers/AuthController.cs` — add `SendVerification` action
- `Lymoon.API/DTOs/Auth/RegisterRequest.cs` — add `VerificationCode` field
- `Lymoon.API/Services/AuthService.cs` — inject `IEmailVerificationService`, verify OTP in `RegisterAsync`

**Frontend — modified:**
- `lymoon-mobile/src/lib/queries/auth.ts` — add `useSendVerificationMutation`; update `useRegisterMutation` vars type
- `lymoon-mobile/app/(auth)/register.tsx` — full UI overhaul (Send button, countdown, OTP field)

**Docs — modified:**
- `lymoon-mobile/docs/API.md` — add `POST /api/auth/send-verification`, update register schema

---

## Task 1: Add MailKit and SMTP Configuration

**Files:**
- Modify: `Lymoon.API/Lymoon.API.csproj`
- Create: `Lymoon.API/Models/SmtpSettings.cs`
- Modify: `Lymoon.API/appsettings.json`

- [x] **Step 1: Add MailKit NuGet package**

```bash
cd "d:\Vibe coding projects\Lymoon\Lymoon.API"
dotnet add package MailKit --version 4.*
```

Expected: `PackageReference` for MailKit added to `Lymoon.API.csproj`.

- [x] **Step 2: Create SmtpSettings model**

Create `Lymoon.API/Models/SmtpSettings.cs`:
```csharp
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
```

- [x] **Step 3: Add SmtpSettings to appsettings.json**

In `Lymoon.API/appsettings.json`, add the `SmtpSettings` section alongside the existing `JwtSettings`:
```json
"SmtpSettings": {
  "Host": "smtp.example.com",
  "Port": 587,
  "UseSsl": false,
  "Username": "your-smtp-username",
  "Password": "your-smtp-password",
  "FromEmail": "noreply@lymoon.app",
  "FromName": "Lymoon",
  "UseConsoleLogger": true
}
```

> **Note for production:** Set `UseConsoleLogger: false` and fill in real SMTP credentials. Recommended providers: Mailtrap (testing), SendGrid (production), Gmail SMTP.

- [x] **Step 4: Commit**

```bash
cd "d:\Vibe coding projects\Lymoon"
git add Lymoon.API/Lymoon.API.csproj Lymoon.API/Models/SmtpSettings.cs Lymoon.API/appsettings.json
git commit -m "feat(email): add MailKit package and SmtpSettings configuration"
```

---

## Task 2: Email Service

**Files:**
- Create: `Lymoon.API/Services/IEmailService.cs`
- Create: `Lymoon.API/Services/EmailService.cs`

- [x] **Step 1: Create IEmailService interface**

Create `Lymoon.API/Services/IEmailService.cs`:
```csharp
namespace Lymoon.API.Services;

public interface IEmailService
{
    Task SendVerificationCodeAsync(string toEmail, string code);
}
```

- [x] **Step 2: Create EmailService implementation**

Create `Lymoon.API/Services/EmailService.cs`:
```csharp
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
```

- [x] **Step 3: Commit**

```bash
git add Lymoon.API/Services/IEmailService.cs Lymoon.API/Services/EmailService.cs
git commit -m "feat(email): add IEmailService and MailKit EmailService implementation"
```

---

## Task 3: Email Verification Service (OTP Logic)

**Files:**
- Create: `Lymoon.API/Services/IEmailVerificationService.cs`
- Create: `Lymoon.API/Services/EmailVerificationService.cs`

- [x] **Step 1: Create IEmailVerificationService interface**

Create `Lymoon.API/Services/IEmailVerificationService.cs`:
```csharp
namespace Lymoon.API.Services;

public interface IEmailVerificationService
{
    /// <summary>
    /// Generates a 6-digit code, stores it in cache, and returns it.
    /// Throws InvalidOperationException("rate_limited") if a code was sent within 60 seconds.
    /// </summary>
    string GenerateCode(string email);

    /// <summary>
    /// Verifies the code for the email.
    /// Throws InvalidOperationException("code_expired") if no code exists.
    /// Throws InvalidOperationException("invalid_code") if code doesn't match.
    /// Throws InvalidOperationException("too_many_attempts") after 5 wrong attempts.
    /// Removes the code from cache on success.
    /// </summary>
    void VerifyCode(string email, string code);
}
```

- [x] **Step 2: Create EmailVerificationService implementation**

Create `Lymoon.API/Services/EmailVerificationService.cs`:
```csharp
using Microsoft.Extensions.Caching.Memory;

namespace Lymoon.API.Services;

public class EmailVerificationService : IEmailVerificationService
{
    private readonly IMemoryCache _cache;
    private const int CodeExpiryMinutes = 10;
    private const int CooldownSeconds = 60;
    private const int MaxAttempts = 5;

    public EmailVerificationService(IMemoryCache cache)
    {
        _cache = cache;
    }

    private static string CodeKey(string email) => $"ev_code:{email.ToLowerInvariant()}";
    private static string AttemptsKey(string email) => $"ev_attempts:{email.ToLowerInvariant()}";
    private static string CooldownKey(string email) => $"ev_cooldown:{email.ToLowerInvariant()}";

    public string GenerateCode(string email)
    {
        if (_cache.TryGetValue(CooldownKey(email), out _))
            throw new InvalidOperationException("rate_limited");

        var code = Random.Shared.Next(100000, 999999).ToString();
        var expiry = TimeSpan.FromMinutes(CodeExpiryMinutes);

        _cache.Set(CodeKey(email), code, expiry);
        _cache.Set(AttemptsKey(email), 0, expiry);
        _cache.Set(CooldownKey(email), true, TimeSpan.FromSeconds(CooldownSeconds));

        return code;
    }

    public void VerifyCode(string email, string code)
    {
        var attemptsKey = AttemptsKey(email);
        var attempts = _cache.GetOrCreate(attemptsKey, e =>
        {
            e.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CodeExpiryMinutes);
            return 0;
        });

        if (attempts >= MaxAttempts)
            throw new InvalidOperationException("too_many_attempts");

        if (!_cache.TryGetValue(CodeKey(email), out string? storedCode))
            throw new InvalidOperationException("code_expired");

        if (storedCode != code)
        {
            _cache.Set(attemptsKey, attempts + 1, TimeSpan.FromMinutes(CodeExpiryMinutes));
            throw new InvalidOperationException("invalid_code");
        }

        _cache.Remove(CodeKey(email));
        _cache.Remove(AttemptsKey(email));
        _cache.Remove(CooldownKey(email));
    }
}
```

- [x] **Step 3: Register services in Program.cs**

In `Lymoon.API/Program.cs`, add these lines after the existing service registrations (e.g., after `builder.Services.AddScoped<IAuthService, AuthService>();`):
```csharp
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("SmtpSettings"));
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddSingleton<IEmailVerificationService, EmailVerificationService>();
```

Also add the `using` for the SmtpSettings model if not already present at the top of Program.cs:
```csharp
using Lymoon.API.Models;
```

> **Note:** `IEmailVerificationService` is registered as `Singleton` because `IMemoryCache` is singleton-scoped and OTP state must persist across requests.

- [x] **Step 4: Commit**

```bash
git add Lymoon.API/Services/IEmailVerificationService.cs Lymoon.API/Services/EmailVerificationService.cs Lymoon.API/Program.cs
git commit -m "feat(email): add EmailVerificationService with IMemoryCache OTP logic"
```

---

## Task 4: Send Verification API Endpoint

**Files:**
- Create: `Lymoon.API/DTOs/Auth/SendVerificationRequest.cs`
- Modify: `Lymoon.API/Controllers/AuthController.cs`

- [x] **Step 1: Create SendVerificationRequest DTO**

Create `Lymoon.API/DTOs/Auth/SendVerificationRequest.cs`:
```csharp
using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Auth;

public class SendVerificationRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = "";
}
```

- [x] **Step 2: Add SendVerification action to AuthController**

In `Lymoon.API/Controllers/AuthController.cs`, inject the new services and add the endpoint.

Update the constructor to inject `IEmailService` and `IEmailVerificationService`:
```csharp
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
```

Add the new endpoint after the existing `Register` action:
```csharp
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
```

- [x] **Step 3: Verify the backend builds**

```bash
cd "d:\Vibe coding projects\Lymoon\Lymoon.API"
dotnet build
```

Expected: `Build succeeded` with 0 errors.

- [x] **Step 4: Commit**

```bash
cd "d:\Vibe coding projects\Lymoon"
git add Lymoon.API/DTOs/Auth/SendVerificationRequest.cs Lymoon.API/Controllers/AuthController.cs
git commit -m "feat(auth): add POST /api/auth/send-verification endpoint"
```

---

## Task 5: Extend Register Endpoint to Verify OTP

**Files:**
- Modify: `Lymoon.API/DTOs/Auth/RegisterRequest.cs`
- Modify: `Lymoon.API/Services/AuthService.cs`

- [x] **Step 1: Add VerificationCode to RegisterRequest**

In `Lymoon.API/DTOs/Auth/RegisterRequest.cs`, add the new field:
```csharp
using System.ComponentModel.DataAnnotations;

namespace Lymoon.API.DTOs.Auth;

public class RegisterRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = "";

    [Required, MinLength(6)]
    public string Password { get; set; } = "";

    [Required, MaxLength(50)]
    public string DisplayName { get; set; } = "";

    [Required, StringLength(6, MinimumLength = 6)]
    public string VerificationCode { get; set; } = "";
}
```

- [x] **Step 2: Inject IEmailVerificationService into AuthService**

In `Lymoon.API/Services/AuthService.cs`, add the dependency:

Find the constructor and add `IEmailVerificationService verificationService`:
```csharp
private readonly IEmailVerificationService _verificationService;

// Add verificationService parameter to the existing constructor:
public AuthService(
    UserManager<AppUser> userManager,
    IJwtService jwtService,
    IEmailVerificationService verificationService
    // ... any other existing parameters
)
{
    // ... existing assignments
    _verificationService = verificationService;
}
```

- [x] **Step 3: Add OTP verification to RegisterAsync**

In `Lymoon.API/Services/AuthService.cs`, at the top of `RegisterAsync`, before the email uniqueness check, add:
```csharp
public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
{
    // Verify email OTP first
    _verificationService.VerifyCode(request.Email, request.VerificationCode);

    // ... rest of existing RegisterAsync logic unchanged
    var existingUser = await _userManager.FindByEmailAsync(request.Email);
    if (existingUser != null)
        throw new InvalidOperationException("email_taken");
    // ...
}
```

- [x] **Step 4: Add exception handling for verification errors in AuthController**

In `AuthController.cs`, update the `Register` action to handle verification errors:
```csharp
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
```

- [x] **Step 5: Build and verify**

```bash
cd "d:\Vibe coding projects\Lymoon\Lymoon.API"
dotnet build
```

Expected: `Build succeeded` with 0 errors.

- [x] **Step 6: Manual smoke test (with API running)**

Start the API: `dotnet run`

Test send-verification:
```bash
curl -X POST http://localhost:5253/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```
Expected: `{"ok":true}` and code logged to console (since `UseConsoleLogger: true`).

Test rate limiting (send again immediately):
Expected: HTTP 429 `{"error":"rate_limited"}`.

- [x] **Step 7: Commit**

```bash
cd "d:\Vibe coding projects\Lymoon"
git add Lymoon.API/DTOs/Auth/RegisterRequest.cs Lymoon.API/Services/AuthService.cs Lymoon.API/Controllers/AuthController.cs
git commit -m "feat(auth): require email OTP verification on register"
```

---

## Task 6: Update API Documentation

**Files:**
- Modify: `lymoon-mobile/docs/API.md`

- [x] **Step 1: Add new endpoint and update register schema**

In `lymoon-mobile/docs/API.md`, under the **Authentication** section, add:

```markdown
### POST /api/auth/send-verification

Generates and emails a 6-digit OTP to the given address. Rate-limited to once per 60 seconds per email. OTP expires in 10 minutes.

**Request**
```json
{ "email": "user@example.com" }
```

**Responses**

| Status | Body | Meaning |
|--------|------|---------|
| 200 | `{ "ok": true }` | Code sent |
| 429 | `{ "error": "rate_limited" }` | Sent too recently (< 60s) |
| 400 | `{ "error": "..." }` | Validation error |
| 500 | `{ "error": "..." }` | Email send failed |
```

Also update the **POST /api/auth/register** section to add `verificationCode` to the request schema:

```markdown
**Request**
```json
{
  "displayName": "Alex Rivera",
  "email": "user@example.com",
  "password": "secret123",
  "verificationCode": "482910"
}
```

Additional error codes for register:
| Error | Meaning |
|-------|---------|
| `code_expired` | OTP not found or expired (10 min TTL) |
| `invalid_code` | Wrong code entered |
| `too_many_attempts` | 5+ wrong attempts — request new code |
```

- [x] **Step 2: Commit**

```bash
cd "d:\Vibe coding projects\Lymoon"
git add lymoon-mobile/docs/API.md
git commit -m "docs(api): document send-verification endpoint and updated register schema"
```

---

## Task 7: Frontend — Add Query Hook

**Files:**
- Modify: `lymoon-mobile/src/lib/queries/auth.ts`

- [x] **Step 1: Add useSendVerificationMutation and update useRegisterMutation**

In `lymoon-mobile/src/lib/queries/auth.ts`:

Add `useSendVerificationMutation` after the existing imports:
```typescript
export function useSendVerificationMutation() {
  return useMutation({
    mutationFn: (email: string) =>
      apiPost<{ ok: boolean }>('/auth/send-verification', { email }),
  });
}
```

Update `useRegisterMutation` — change the `mutationFn` vars type to include `verificationCode`:
```typescript
export function useRegisterMutation() {
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: (vars: {
      email: string;
      password: string;
      displayName: string;
      verificationCode: string;
    }) => apiPost<AuthResponse>('/auth/register', vars),
    onSuccess: (data) => {
      setUser({
        userId: data.user.id,
        userName: data.user.displayName,
        userRole: 'Member',
        avatarInitials: computeInitials(data.user.displayName),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}
```

- [x] **Step 2: Commit**

```bash
cd "d:\Vibe coding projects\Lymoon"
git add lymoon-mobile/src/lib/queries/auth.ts
git commit -m "feat(auth): add useSendVerificationMutation hook"
```

---

## Task 8: Frontend — Register Screen UI Overhaul

**Files:**
- Modify: `lymoon-mobile/app/(auth)/register.tsx`

- [ ] **Step 1: Rewrite register.tsx with email verification UX**

Replace the full content of `lymoon-mobile/app/(auth)/register.tsx` with:

```typescript
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegisterMutation, useSendVerificationMutation } from '@/lib/queries/auth';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [codeSuccessMsg, setCodeSuccessMsg] = useState<string | null>(null);

  const submittingRef = useRef(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const codeRef = useRef<TextInput>(null);

  const register = useRegisterMutation();
  const sendVerification = useSendVerificationMutation();

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function handleSendCode() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email first.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg(null);
    sendVerification.mutate(trimmedEmail, {
      onSuccess: () => {
        setCodeSent(true);
        setCountdown(60);
        setCodeSuccessMsg(`Code sent to ${trimmedEmail}`);
        setTimeout(() => codeRef.current?.focus(), 300);
      },
      onError: (err) => {
        const msg =
          err.message === 'rate_limited'
            ? 'Please wait 60 seconds before requesting another code.'
            : 'Failed to send code. Please check your email and try again.';
        setErrorMsg(msg);
      },
    });
  }

  function handleRegister() {
    if (submittingRef.current) return;
    if (!displayName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!codeSent) {
      setErrorMsg('Please verify your email before registering.');
      return;
    }
    if (verificationCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    setErrorMsg(null);
    submittingRef.current = true;
    register.mutate(
      {
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        verificationCode,
      },
      {
        onSuccess: () => {
          submittingRef.current = false;
          router.replace('/(app)');
        },
        onError: (err) => {
          submittingRef.current = false;
          const errorMap: Record<string, string> = {
            email_taken: 'An account with this email already exists.',
            code_expired: 'Verification code has expired. Please request a new one.',
            invalid_code: 'Invalid verification code. Please try again.',
            too_many_attempts: 'Too many incorrect attempts. Please request a new code.',
          };
          setErrorMsg(errorMap[err.message] ?? 'Registration failed. Please try again.');
        },
      },
    );
  }

  const sendButtonDisabled = sendVerification.isPending || countdown > 0;
  const canSubmit = verificationCode.length === 6 && !register.isPending;

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-4">
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            className="size-10 rounded-full bg-white items-center justify-center border border-[#f1f5f9] mb-10"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
          >
            <Ionicons name="chevron-back" size={16} color="#0f172a" />
          </TouchableOpacity>

          <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', letterSpacing: -0.5 }}>
            Create account
          </Text>
          <Text className="mt-2 mb-10" style={{ fontSize: 15, color: '#64748b' }}>
            Join Lymoon to manage your team's schedule
          </Text>

          <View className="gap-4">
            {/* Name */}
            <View>
              <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="e.g. Alex Rivera"
                placeholderTextColor="#94a3b8"
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                style={{ fontSize: 15, color: '#0f172a' }}
              />
            </View>

            {/* Email + Send button */}
            <View>
              <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Email</Text>
              <View className="flex-row gap-2 items-center">
                <TextInput
                  ref={emailRef}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (codeSent) {
                      setCodeSent(false);
                      setVerificationCode('');
                      setCodeSuccessMsg(null);
                    }
                  }}
                  placeholder="name@example.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  editable={!sendVerification.isPending}
                  className="flex-1 h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                  style={{ fontSize: 15, color: '#0f172a' }}
                />
                <TouchableOpacity
                  onPress={handleSendCode}
                  activeOpacity={0.75}
                  disabled={sendButtonDisabled}
                  className="h-[52px] rounded-[14px] items-center justify-center px-3 bg-white border border-[#e2e8f0]"
                  style={{
                    minWidth: 100,
                    opacity: sendButtonDisabled ? 0.5 : 1,
                  }}
                >
                  {sendVerification.isPending ? (
                    <ActivityIndicator size="small" color="#64748b" />
                  ) : (
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: '#64748b',
                    }}>
                      {countdown > 0 ? `${countdown}s` : codeSent ? 'Resend' : 'Send'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Verification code — shown after sending */}
            {codeSent && (
              <View>
                <View className="flex-row items-center gap-1 mb-2">
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Verification Code</Text>
                  {codeSuccessMsg && (
                    <Text style={{ fontSize: 12, color: '#22c55e' }}>· {codeSuccessMsg}</Text>
                  )}
                </View>
                <TextInput
                  ref={codeRef}
                  value={verificationCode}
                  onChangeText={(v) => setVerificationCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                  style={{ fontSize: 20, fontWeight: '600', color: '#0f172a', letterSpacing: 6 }}
                />
              </View>
            )}

            {/* Password */}
            <View>
              <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Password</Text>
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                style={{ fontSize: 15, color: '#0f172a', letterSpacing: 0 }}
              />
            </View>

            {/* Confirm Password */}
            <View>
              <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Confirm Password</Text>
              <TextInput
                ref={confirmPasswordRef}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                style={{ fontSize: 15, color: '#0f172a', letterSpacing: 0 }}
              />
            </View>

            {/* Error message */}
            {errorMsg ? (
              <Text style={{ fontSize: 13, color: '#ef4444' }}>{errorMsg}</Text>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={!canSubmit}
              className="h-[56px] rounded-[16px] items-center justify-center mt-2"
              style={{
                backgroundColor: '#b6ec13',
                shadowColor: '#b6ec13',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: canSubmit ? 0.25 : 0,
                shadowRadius: 12,
                elevation: canSubmit ? 6 : 0,
                opacity: canSubmit ? 1 : 0.45,
              }}
            >
              {register.isPending ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-8 gap-1">
            <Text style={{ fontSize: 14, color: '#64748b' }}>Already have an account?</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.replace('/(auth)/email-login')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles (no red squiggles)**

In the Expo dev server terminal, check for TypeScript errors:
```bash
cd "d:\Vibe coding projects\Lymoon\lymoon-mobile"
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run Expo and manually test the full flow** ← manual

```bash
npx expo start
```

Test checklist:
1. Open register screen
2. Enter a name
3. Leave email blank → tap "Send" → error: "Please enter your email first"
4. Enter invalid email → tap "Send" → error: "valid email address"
5. Enter valid email → tap "Send" → button shows spinner → then "59s" countdown
6. Check API console output for the code (dev mode)
7. Verification code field appears with "Code sent to …" label
8. Tap button again during countdown → button is disabled (shows "59s", no action)
9. Enter the 6-digit code in the verification field → confirm letterSpacing: 6 applies only to that field
10. Tap back → re-enter register screen → confirm Password field has NO extra letter spacing
11. Enter correct code → fill password + confirm → "Create Account" becomes active
12. Enter wrong code → tap "Create Account" → error: "Invalid verification code"
13. After countdown reaches 0 → button reads "Resend" and becomes tappable again
14. Start fresh: enter correct code → tap "Create Account" → navigates to app
15. Visual check: "Send Code"/"Resend" button should appear as a subtle secondary button (white bg, gray border, gray text) — NOT the bold lime-green primary style

- [ ] **Step 4: Commit**

```bash
cd "d:\Vibe coding projects\Lymoon"
git add lymoon-mobile/app/(auth)/register.tsx
git commit -m "fix(register): rename Send→Send Code, downgrade to secondary button, fix letter-spacing bleed on password inputs"
```

---

## Verification Summary

**End-to-end flow to confirm everything works:**

1. `dotnet run` in `Lymoon.API/`
2. `npx expo start` in `lymoon-mobile/`
3. Navigate to Register
4. Fill name + email → tap "Send" → check API console for the 6-digit code
5. Enter code → fill password + confirm → tap "Create Account"
6. App navigates to `/(app)` → registration complete

**Common issues:**
- Build error in AuthService: check that `IEmailVerificationService` is injected in the constructor and that the parameter order matches existing constructor signature
- `rate_limited` on first send: ensure previous test codes in cache are cleared (restart API)
- TypeScript error on `verificationCode` field: ensure `useRegisterMutation` `mutationFn` vars type was updated
