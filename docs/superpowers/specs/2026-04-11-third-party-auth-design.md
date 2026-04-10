# Third-Party Auth (Google + Apple Sign-In) — Design Spec

**Date:** 2026-04-11
**Status:** Approved

---

## Overview

Implement Google and Apple sign-in on the login screen. The backend endpoints already exist and are fully implemented. This spec covers only the mobile-side work and the configuration steps required to wire everything together.

---

## Background

The login screen (`app/(auth)/login.tsx`) already renders Google and Apple buttons, but they currently show "Coming Soon" alerts. The backend provides:

- `POST /api/auth/google` — accepts `{ idToken: string }`, validates via Google's JWT library, auto-creates or finds the user, returns `AuthResponse`
- `POST /api/auth/apple` — accepts `{ idToken: string }`, validates via Apple's JWKS, auto-creates or finds the user, returns `AuthResponse`

---

## Architecture

### Data Flow (both providers follow the same pattern)

```
User taps button
  → OAuth flow (browser / native sheet)
  → Receive idToken (JWT)
  → POST /api/auth/google  or  /api/auth/apple  with { idToken }
  → Receive AuthResponse { accessToken, refreshToken, user }
  → useAuthStore.setUser(...)
  → router.replace('/(app)')
```

### Google — PKCE Authorization Code Flow

```
expo-auth-session opens browser at Google OAuth endpoint
  → User authenticates with Google account
  → Redirected back via Expo auth proxy
  → Exchange authorization code for tokens (includes id_token)
  → Send id_token to backend
```

Uses `expo-auth-session/providers/google` with Web Client ID. The Expo auth proxy (`https://auth.expo.io/`) handles the redirect in Expo Go, removing the need for deep-link configuration during development.

### Apple — Native Sign-In Sheet

```
AppleAuthentication.signInAsync()
  → System presents Apple Sign-In sheet
  → User authenticates
  → credential.identityToken (JWT issued by Apple)
  → Send identityToken to backend
```

Uses `expo-apple-authentication`. iOS only — Apple button is already gated behind `Platform.OS === 'ios'`.

---

## New Packages

| Package | Purpose |
|---------|---------|
| `expo-auth-session` | Google OAuth PKCE flow |
| `expo-web-browser` | Required peer for expo-auth-session |
| `expo-apple-authentication` | Apple native sign-in sheet |

---

## Mobile Changes

### `src/lib/queries/auth.ts` — New mutations

Add `useGoogleSignInMutation` and `useAppleSignInMutation` following the existing `useLoginMutation` pattern:

- `mutationFn` posts `{ idToken }` to the respective backend endpoint
- `onSuccess` calls `useAuthStore.setUser(...)` with the same shape as the email login mutation

### `app/(auth)/login.tsx` — Replace placeholder handlers

**`handleGooglePress`:**
1. Call `promptAsync()` from `Google.useAuthRequest`
2. If `result.type !== 'success'`, return silently (user cancelled or error)
3. Exchange the authorization code for tokens via `exchangeCodeAsync`
4. Extract `idToken` from the token response
5. Call `googleSignIn.mutate(idToken)`

**`handleApplePress`:**
1. Call `AppleAuthentication.signInAsync({ requestedScopes: [FULL_NAME, EMAIL] })`
2. Extract `credential.identityToken`
3. Call `appleSignIn.mutate(identityToken)`

Both handlers add an `errorMsg` state (same inline error pattern as `email-login.tsx`).

### Error Handling

| Scenario | Behaviour |
|----------|-----------|
| User cancels OAuth | Silent — no error shown |
| Google OAuth / code exchange fails | `"Google sign-in failed. Please try again."` |
| Apple sign-in fails | `"Apple sign-in failed. Please try again."` |
| Backend returns error | `"Sign-in failed. Please try again."` |

### `app.json` — New fields

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.lymoon.app"
    },
    "plugins": [
      "expo-router",
      "expo-apple-authentication"
    ]
  }
}
```

### Environment variable

Add to `.env` (create if not present):

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web_client_id_from_google_console>
```

Read in code via `process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

---

## Backend Configuration

Update `appsettings.Development.json` (never commit real values to git):

```json
{
  "GoogleClientId": "<web_client_id — same value as EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID>",
  "AppleAppBundleId": "com.lymoon.app"
}
```

---

## Google Cloud Console Setup (manual steps)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a new project
2. **APIs & Services → OAuth consent screen** → fill in app name (Lymoon), add test users
3. **Credentials → Create Credentials → OAuth 2.0 Client ID** → type: **Web application**
4. Under **Authorized redirect URIs**, add:
   `https://auth.expo.io/@<your-expo-username>/lymoon-mobile`
5. Copy the generated **Client ID** → paste into `.env` and `appsettings.Development.json`

---

## Edge Cases

| Case | Handling |
|------|----------|
| Apple relay email (`xxx@privaterelay.appleid.com`) | Backend stores it normally; no impact on login |
| Apple only provides name on first sign-in | Backend falls back to `email.Split('@')[0]` as DisplayName |
| Same email registered via email + Google | Backend finds existing user by email and reuses it (auto-merge) |

---

## Out of Scope

- Apple Developer account setup (required for App Store submission, not for Expo Go development)
- Android Google Sign-In (native SDK) — deferred; current implementation uses browser-based flow which works on both platforms
- Token refresh for OAuth sessions — handled by existing `tryRefresh` logic in `lib/tokenRefresh.ts`
