# Auth Guard (Option B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global auth guard in `app/_layout.tsx` using `useSegments` + `useRouter` that defensively redirects users who access a route they are not authorized for — complementing the existing Option A redirect in `app/index.tsx`.

**Architecture:** A custom hook `useAuthGuard` encapsulates all guard logic and is called inside `RootLayout`. It uses `useRootNavigationState` to defer navigation until the Expo Router is mounted, then redirects based on `isAuthenticated` and the current route segment. Option A (`app/index.tsx`) handles cold-start redirects; Option B handles runtime auth state changes (logout, session expiry) and any deep-link bypassing `index.tsx`.

**Tech Stack:** Expo Router v3 (`useSegments`, `useRouter`, `useRootNavigationState`), Zustand (`useAuthStore`), TypeScript.

---

## Context

Option A (a `<Redirect>` in `app/index.tsx`) was implemented first. It handles cold-start routing correctly but does not guard against:
- Logout while inside `(app)/*` — without a guard the user stays on the current screen
- Direct deep-links to `/(app)/settings` etc. while unauthenticated

Option B adds this defensive layer. Both options coexist without conflict.

---

## File Map

| File | Action |
|---|---|
| `src/hooks/useAuthGuard.ts` | **Create** — hook with all guard logic |
| `app/_layout.tsx` | **Modify** — import and call `useAuthGuard()` |
| `app/index.tsx` | **No change** — Option A stays as-is |

---

## Task 1: Create `src/hooks/useAuthGuard.ts`

**Files:**
- Create: `lymoon-mobile/src/hooks/useAuthGuard.ts`

- [ ] **Step 1: Write the hook file**

```typescript
import { useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export function useAuthGuard(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Defer navigation until Expo Router is mounted.
    // navigationState?.key is undefined until the navigator tree is ready.
    if (!navigationState?.key) return;

    const inAppGroup = segments[0] === '(app)';
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && inAppGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)/');
    }
  }, [isAuthenticated, segments, navigationState?.key]);
}
```

- [ ] **Step 2: Verify TypeScript path alias resolves**

```bash
cd lymoon-mobile
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors about the new file.

---

## Task 2: Wire `useAuthGuard` into the root layout

**Files:**
- Modify: `lymoon-mobile/app/_layout.tsx`

- [ ] **Step 1: Update `app/_layout.tsx`**

Replace the entire file content with:

```typescript
import '../global.css';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const queryClient = new QueryClient();

export default function RootLayout() {
  useAuthGuard();

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd lymoon-mobile
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd lymoon-mobile
git add src/hooks/useAuthGuard.ts app/_layout.tsx
git commit -m "feat(auth): add global auth guard via useAuthGuard hook"
```

---

## Verification

### Scenario walkthrough (manual, in the simulator)

| Scenario | Expected result |
|---|---|
| Cold start, not authenticated | `index.tsx` Option A redirects to `/(auth)/login` immediately |
| Cold start, authenticated | `index.tsx` Option A redirects to `/(app)/` immediately |
| Logout from any `(app)/*` screen (call `clearUser()`) | `useAuthGuard` detects `isAuthenticated=false` + `inAppGroup=true`, calls `router.replace('/(auth)/login')` |
| Deep-link to `/(app)/settings` while logged out | `useAuthGuard` detects unauthorized segment, redirects to `/(auth)/login` |
| Login succeeds from `/(auth)/email-login` | `useAuthGuard` detects `isAuthenticated=true` + `inAuthGroup=true`, redirects to `/(app)/` |

### Start the dev server and test manually

```bash
cd lymoon-mobile
npx expo start
```

Test the logout scenario by adding a temporary `clearUser()` call in a settings screen button, then confirm redirect to login.
