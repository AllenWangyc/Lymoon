# Frontend API Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace all hardcoded mock data and Zustand-only mutations in `lymoon-mobile` with real API calls using TanStack Query, wiring every screen to the live backend defined in `docs/API.md`.

**Architecture:** Create a thin `src/lib/api.ts` fetch wrapper (JWT auto-attach + 401 refresh), then add TanStack Query hooks in `src/lib/queries/` per domain (auth, schedules, shifts, notifications). Screens consume those hooks instead of Zustand mock state. Zustand survives but only holds auth tokens + UI-only ephemeral state — all server state moves to TanStack Query cache.

**Tech Stack:** Expo SDK 52, Expo Router v3, TanStack Query v5 (already installed), Zustand v5, TypeScript strict, NativeWind v4.

---

## Conflict Resolution Note

Where `docs/API.md` and `docs/frontend-summary.md` differ, **frontend-summary.md takes precedence** (per CLAUDE.md). Key decisions:
- `ScheduleItem.subtitle` is **locally computed** (not returned by API). Compute as `"${scheduleType} • ${format(currentWeek, 'MMM d')}"`.
- `Shift` uses `employeeId` (matches both `API.md` and existing `src/types/schedule.ts`). The `userId` reference in `frontend-summary.md` Section 1 is a documentation inconsistency; `employeeId` is correct.
- `description` max is described as "max 200 characters" in API.md and "max 20 words" in frontend-summary.md. Frontend enforces 200-character limit (API.md wins on the constraint since it is the server contract).

---

## File Map

### New files to create
| File | Responsibility |
|------|----------------|
| `src/lib/tokenRefresh.ts` | Token refresh logic: calls `/auth/refresh`, updates Zustand, returns success bool |
| `src/lib/api.ts` | **Refactor existing file**: add `handleResponse<T>` helper, remove duplication, import `tryRefresh` |
| `src/lib/queries/auth.ts` | `useLoginMutation`, `useRegisterMutation` |
| `src/lib/queries/schedules.ts` | `useSchedules`, `useCreateSchedule`, `useScheduleDetail`, `useScheduleLookup`, `useJoinSchedule`, `useRenameSchedule`, `useLeaveSchedule`, `useAddNextWeek`, `useScheduleMembers`, `useWorkHours`, `useRemoveMember` |
| `src/lib/queries/shifts.ts` | `useAddShift`, `useUpdateShift`, `useDeleteShift` |
| `src/lib/queries/notifications.ts` | `useNotifications`, `useMarkNotificationsRead` |
| `app/(auth)/register.tsx` | Registration screen |

### Files to modify
| File | Change |
|------|--------|
| `src/types/schedule.ts` | Add `currentWeek`, `currentUserRole` fields |
| `src/stores/authStore.ts` | Add token fields + `setUser`, `setTokens`, `clearUser` actions |
| `src/stores/scheduleStore.ts` | Remove all mock seed data; keep only UI state (`pendingToast`, `showNewScheduleSheet`) |
| `src/features/schedule/constants.ts` | Remove `MOCK_EMPLOYEES`, `MOCK_SHIFTS`, `MOCK_WORK_HOURS_HISTORY`, `ENGINEERING_SPRINT_TEMPLATE` |
| `app/(auth)/email-login.tsx` | Replace `console.log` with `useLoginMutation`; wire register nav |
| `app/(app)/index.tsx` | Replace `useScheduleStore().schedules` with `useSchedules` |
| `app/(app)/create-schedule.tsx` | Replace Zustand mutation with `useCreateSchedule` |
| `app/(app)/schedule-created.tsx` | Read from navigation params instead of Zustand |
| `app/join-schedule.tsx` | Replace `setTimeout` mock with `useScheduleLookup` + `useJoinSchedule` |
| `app/(app)/schedule/[id].tsx` | Replace Zustand reads with `useScheduleDetail`; wire all action mutations |
| `app/(app)/notifications/index.tsx` | Wire `useNotifications` + `useMarkNotificationsRead` |

---

## Phase 1 — Foundation

### Task 1: Refactor `src/lib/api.ts` — eliminate duplication + extract token refresh

> `src/lib/api.ts` already exists and implements the core fetch wrapper. This task refactors it
> to remove structural issues: 4× duplicated error-handling blocks and `tryRefresh` buried inline.
>
> **Why not a full interceptor pipeline?**
> An axios-style interceptor pipeline would add ~60 lines of boilerplate for exactly 2 concerns
> (auth + error). TanStack Query already handles retry/error at the query layer. The right
> abstraction here is a 2-file split: isolated `tokenRefresh.ts` + a cleaner `api.ts`.

**Files:**
- Create: `src/lib/tokenRefresh.ts`
- Modify: `src/lib/api.ts`

- [x] **Step 1: Create `src/lib/tokenRefresh.ts`**

Move `tryRefresh` out of `api.ts` into its own file. `API_BASE` is imported from `api.ts`.

```typescript
// src/lib/tokenRefresh.ts
import { useAuthStore } from '@/stores/authStore';
import { API_BASE } from './api';

export async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setTokens, clearUser } = useAuthStore.getState();
  if (!refreshToken) { clearUser(); return false; }
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { clearUser(); return false; }
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearUser();
    return false;
  }
}
```

- [x] **Step 2: Refactor `src/lib/api.ts`**

Add private `handleResponse<T>` helper; import `tryRefresh`; collapse HTTP methods to one-liners.

```typescript
// src/lib/api.ts
import { useAuthStore } from '@/stores/authStore';
import { tryRefresh } from './tokenRefresh';

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:5000/api';

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: 'Unknown error' }))) as { error: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function fetchWithAuth(path: string, options: ApiOptions = {}): Promise<Response> {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const init = {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  };
  const response = await fetch(`${API_BASE}${path}`, init);

  if (response.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${useAuthStore.getState().accessToken}`;
      return fetch(`${API_BASE}${path}`, init);
    }
  }

  return response;
}

export const apiGet = <T>(path: string) =>
  fetchWithAuth(path, { method: 'GET' }).then(r => handleResponse<T>(r));

export const apiPost = <T>(path: string, body?: unknown) =>
  fetchWithAuth(path, { method: 'POST', body }).then(r => handleResponse<T>(r));

export const apiPatch = <T>(path: string, body?: unknown) =>
  fetchWithAuth(path, { method: 'PATCH', body }).then(r => handleResponse<T>(r));

export const apiDelete = <T>(path: string, body?: unknown) =>
  fetchWithAuth(path, { method: 'DELETE', body }).then(r => handleResponse<T>(r));
```

- [x] **Step 3: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -30
```
Expected: zero errors in `src/lib/api.ts` or `src/lib/tokenRefresh.ts`.

- [x] **Step 4: Commit**

```bash
git add src/lib/api.ts src/lib/tokenRefresh.ts
git commit -m "refactor(api): extract tokenRefresh util and add handleResponse helper"
```

---

### Task 2: Update TypeScript types

**Files:**
- Modify: `src/types/schedule.ts`

- [x] **Step 1: Add missing fields**

Replace the entire file with:

```typescript
// src/types/schedule.ts
export type DayBar = { day: string; opacity: number; isToday?: boolean };

export type ScheduleCategory = 'All' | 'Shift' | 'Event' | 'Personal';

export type ScheduleItem = {
  id: string;
  title: string;
  subtitle: string;          // locally computed — NOT from API
  hours: string;
  iconBg: string;
  days: DayBar[];
  scheduleType?: 'shift' | 'event' | 'personal';
  memberPermission?: 'manager_only' | 'full_collaboration';
  startWeek?: string;        // ISO Monday date, e.g. "2026-03-16"
  currentWeek?: string;      // ISO Monday date — latest active week
  description?: string;
  inviteCode?: string;
};

export type ShiftType = 'Morning' | 'Standard' | 'Afternoon' | 'Custom';

export type Shift = {
  id: string;
  employeeId: string;
  dayOfWeek: number;  // 0 = Mon … 6 = Sun
  startTime: string;  // "09:00"
  endTime: string;    // "13:00"
  shiftType: ShiftType;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
};

export type ScheduleDetail = ScheduleItem & {
  employees: Employee[];
  shifts: Shift[];
  weekStartDate: string;      // ISO date "2024-10-14" (always a Monday)
  currentUserRole: 'Manager' | 'Member';
};
```

- [x] **Step 2: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -30
```

- [x] **Step 3: Commit**

```bash
git add src/types/schedule.ts
git commit -m "feat(types): add currentWeek and currentUserRole fields"
```

---

### Task 3: Update `authStore.ts` — add token fields and actions

**Files:**
- Modify: `src/stores/authStore.ts`

- [x] **Step 1: Replace the store**

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';

export type UserRole = 'Manager' | 'Member';

interface AuthState {
  userId: string | null;
  userName: string | null;
  userRole: UserRole | null;
  avatarInitials: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setUser: (data: {
    userId: string;
    userName: string;
    userRole: UserRole;
    avatarInitials: string;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  userName: null,
  userRole: null,
  avatarInitials: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setUser: (data) =>
    set({
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole,
      avatarInitials: data.avatarInitials,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
    }),

  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

  clearUser: () =>
    set({
      userId: null,
      userName: null,
      userRole: null,
      avatarInitials: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    }),
}));
```

- [x] **Step 2: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -40
```

Expected: Errors will appear in screens that read `userId` / `userName` from the store as non-null — these will be fixed in later tasks. Zero errors specifically from `authStore.ts`.

- [x] **Step 3: Commit**

```bash
git add src/stores/authStore.ts
git commit -m "feat(auth): add token fields and setUser/setTokens/clearUser actions to authStore"
```

---

## Phase 2 — Authentication

### Task 4: Create auth query hooks

**Files:**
- Create: `src/lib/queries/auth.ts`

- [x] **Step 1: Create the file**

```typescript
// src/lib/queries/auth.ts
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import { useAuthStore, type UserRole } from '@/stores/authStore';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string };
}

function computeInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function useLoginMutation() {
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      apiPost<AuthResponse>('/auth/login', vars),
    onSuccess: (data) => {
      setUser({
        userId: data.user.id,
        userName: data.user.displayName,
        userRole: 'Member' as UserRole, // role is per-schedule; authStore holds a fallback
        avatarInitials: computeInitials(data.user.displayName),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}

export function useRegisterMutation() {
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: (vars: { email: string; password: string; displayName: string }) =>
      apiPost<AuthResponse>('/auth/register', vars),
    onSuccess: (data) => {
      setUser({
        userId: data.user.id,
        userName: data.user.displayName,
        userRole: 'Member' as UserRole,
        avatarInitials: computeInitials(data.user.displayName),
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}
```

- [x] **Step 2: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 3: Commit**

```bash
git add src/lib/queries/auth.ts
git commit -m "feat(auth): add useLoginMutation and useRegisterMutation hooks"
```

---

### Task 5: Wire login screen

**Files:**
- Modify: `app/(auth)/email-login.tsx`

- [x] **Step 1: Replace handleLogin**

Replace lines 1–15 with:

```typescript
import { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLoginMutation } from '@/lib/queries/auth';

export default function EmailLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const login = useLoginMutation();

  function handleLogin() {
    setErrorMsg(null);
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => router.replace('/(app)'),
        onError: (err) => setErrorMsg(err.message ?? 'Login failed'),
      },
    );
  }
```

- [x] **Step 2: Add error display and loading state to JSX**

After the password field `</View>`, add:

```tsx
{errorMsg ? (
  <Text style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>{errorMsg}</Text>
) : null}
```

Change the Sign In button to show a spinner while loading:

```tsx
<TouchableOpacity
  onPress={handleLogin}
  activeOpacity={0.85}
  disabled={login.isPending}
  className="h-[56px] rounded-[16px] items-center justify-center mt-2 bg-[#b6ec13]"
  style={{
    shadowColor: '#b6ec13',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    opacity: login.isPending ? 0.7 : 1,
  }}
>
  {login.isPending ? (
    <ActivityIndicator size="small" color="#0f172a" />
  ) : (
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Sign In</Text>
  )}
</TouchableOpacity>
```

- [x] **Step 3: Wire register navigation**

Replace:
```tsx
<TouchableOpacity activeOpacity={0.7}>
  {/* TODO: navigate to register screen when built */}
  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Register</Text>
</TouchableOpacity>
```

With:
```tsx
<TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/register')}>
  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Register</Text>
</TouchableOpacity>
```

- [x] **Step 4: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 5: Commit**

```bash
git add app/(auth)/email-login.tsx
git commit -m "feat(auth): wire email login screen to real API"
```

---

### Task 6: Create register screen

**Files:**
- Create: `app/(auth)/register.tsx`

- [x] **Step 1: Create the file**

```tsx
// app/(auth)/register.tsx
import { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegisterMutation } from '@/lib/queries/auth';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const register = useRegisterMutation();

  function handleRegister() {
    setErrorMsg(null);
    if (!displayName.trim() || !email.trim() || !password) {
      setErrorMsg('All fields are required.');
      return;
    }
    register.mutate(
      { email: email.trim(), password, displayName: displayName.trim() },
      {
        onSuccess: () => router.replace('/(app)'),
        onError: (err) => setErrorMsg(err.message ?? 'Registration failed'),
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]">
      <View className="flex-1 px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
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
          <View>
            <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Alex Rivera"
              placeholderTextColor="#94a3b8"
              autoCapitalize="words"
              className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
              style={{ fontSize: 15, color: '#0f172a' }}
            />
          </View>
          <View>
            <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
              style={{ fontSize: 15, color: '#0f172a' }}
            />
          </View>
          <View>
            <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
              style={{ fontSize: 15, color: '#0f172a' }}
            />
          </View>

          {errorMsg ? (
            <Text style={{ fontSize: 13, color: '#ef4444' }}>{errorMsg}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={register.isPending}
            className="h-[56px] rounded-[16px] items-center justify-center mt-2 bg-[#b6ec13]"
            style={{ shadowColor: '#b6ec13', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6, opacity: register.isPending ? 0.7 : 1 }}
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
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
```

- [x] **Step 2: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 3: Commit**

```bash
git add app/(auth)/register.tsx
git commit -m "feat(auth): add register screen"
```

---

## Phase 3 — Schedule List

### Task 7: Create schedule query hooks (List + Create)

**Files:**
- Create: `src/lib/queries/schedules.ts`

- [x] **Step 1: Create the file**

```typescript
// src/lib/queries/schedules.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { apiGet, apiPost } from '@/lib/api';
import type { ScheduleItem, ScheduleDetail, Employee } from '@/types/schedule';

// ─── Response shapes from API ────────────────────────────────────────────────

interface ApiScheduleItem {
  id: string;
  title: string;
  hours: string;
  iconBg: string;
  days: { day: string; opacity: number; isToday: boolean }[];
  scheduleType: 'shift' | 'event' | 'personal';
  memberPermission: 'manager_only' | 'full_collaboration';
  startWeek: string;
  currentWeek: string;
  description: string | null;
  inviteCode: string;
}

function toScheduleItem(raw: ApiScheduleItem): ScheduleItem {
  const week = raw.currentWeek ? new Date(raw.currentWeek) : new Date();
  const typeLabel = raw.scheduleType.charAt(0).toUpperCase() + raw.scheduleType.slice(1);
  return {
    ...raw,
    description: raw.description ?? undefined,
    subtitle: `${typeLabel} • ${format(week, 'MMM d')}`,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const scheduleKeys = {
  all: ['schedules'] as const,
  detail: (id: string) => ['schedules', id] as const,
  members: (id: string) => ['schedules', id, 'members'] as const,
  workHours: (scheduleId: string, userId: string) =>
    ['schedules', scheduleId, 'members', userId, 'work-hours'] as const,
};

export function useSchedules() {
  return useQuery({
    queryKey: scheduleKeys.all,
    queryFn: () => apiGet<ApiScheduleItem[]>('/schedules').then((items) => items.map(toScheduleItem)),
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      title: string;
      description: string | null;
      scheduleType: 'shift' | 'event' | 'personal';
      startWeek: string;
      memberPermission: 'manager_only' | 'full_collaboration';
      iconBg: string;
    }) => apiPost<ApiScheduleItem>('/schedules', vars).then(toScheduleItem),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  });
}

export function useScheduleDetail(id: string, weekStart?: string) {
  return useQuery({
    queryKey: [...scheduleKeys.detail(id), weekStart],
    queryFn: async () => {
      const path = weekStart
        ? `/schedules/${id}?weekStart=${weekStart}`
        : `/schedules/${id}`;
      const raw = await apiGet<ApiScheduleItem & {
        weekStartDate: string;
        currentUserRole: 'Manager' | 'Member';
        employees: Employee[];
        shifts: {
          id: string;
          employeeId: string;
          dayOfWeek: number;
          startTime: string;
          endTime: string;
          shiftType: string;
        }[];
      }>(path);
      const base = toScheduleItem(raw);
      return {
        ...base,
        weekStartDate: raw.weekStartDate,
        currentUserRole: raw.currentUserRole,
        employees: raw.employees,
        shifts: raw.shifts,
      } as ScheduleDetail & { currentUserRole: 'Manager' | 'Member' };
    },
    enabled: !!id,
  });
}

export function useAddNextWeek(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiPost<{ currentWeek: string }>(`/schedules/${scheduleId}/weeks`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useRenameSchedule(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      apiPost<{ ok: boolean }>(`/schedules/${scheduleId}/rename`, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) });
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useLeaveSchedule(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiPost<{ ok: boolean }>(`/schedules/${scheduleId}/leave`),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  });
}

export function useScheduleLookup() {
  return useMutation({
    mutationFn: (code: string) =>
      apiGet<{ scheduleName: string; managerName: string; memberCount: number }>(
        `/schedules/lookup?code=${encodeURIComponent(code)}`,
      ),
  });
}

export function useJoinSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) =>
      apiPost<{ id: string; title: string; managerName: string; memberCount: number }>(
        '/schedules/join',
        { inviteCode },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.all }),
  });
}

export function useScheduleMembers(scheduleId: string) {
  return useQuery({
    queryKey: scheduleKeys.members(scheduleId),
    queryFn: () =>
      apiGet<{
        id: string;
        name: string;
        role: string;
        avatarInitials: string;
        scheduleRole: 'Manager' | 'Member';
      }[]>(`/schedules/${scheduleId}/members`),
    enabled: !!scheduleId,
  });
}

export function useWorkHours(scheduleId: string, userId: string) {
  return useQuery({
    queryKey: scheduleKeys.workHours(scheduleId, userId),
    queryFn: () =>
      apiGet<{ weekStart: string; weekEnd: string; totalHours: number }[]>(
        `/schedules/${scheduleId}/members/${userId}/work-hours`,
      ),
    enabled: !!scheduleId && !!userId,
  });
}

export function useRemoveMember(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiPost<{ ok: boolean }>(`/schedules/${scheduleId}/members/remove`, { userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.members(scheduleId) }),
  });
}
```

- [x] **Step 2: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 3: Commit**

```bash
git add src/lib/queries/schedules.ts
git commit -m "feat(queries): add schedule query and mutation hooks"
```

---

### Task 8: Update home screen to use `useSchedules`

**Files:**
- Modify: `app/(app)/index.tsx`

- [x] **Step 1: Replace Zustand schedule read with TanStack Query**

Replace:
```typescript
import { useScheduleStore } from '@/stores/scheduleStore';
// and the destructure:
const { schedules, pendingToast, clearPendingToast, showNewScheduleSheet, setShowNewScheduleSheet } = useScheduleStore();
```

With:
```typescript
import { useScheduleStore } from '@/stores/scheduleStore';
import { useSchedules } from '@/lib/queries/schedules';
// and the destructure:
const { pendingToast, clearPendingToast, showNewScheduleSheet, setShowNewScheduleSheet } = useScheduleStore();
const { data: schedules = [], isLoading: schedulesLoading } = useSchedules();
```

- [x] **Step 2: Add loading state to schedule list section**

Replace:
```tsx
{filteredSchedules.length === 0 ? (
```

With:
```tsx
{schedulesLoading ? (
  <View className="items-center py-16">
    <ActivityIndicator size="large" color="#b6ec13" />
  </View>
) : filteredSchedules.length === 0 ? (
```

Add closing `}` to close the ternary (before the closing `</View>` of the schedule list `View`).

Also add `ActivityIndicator` to the import:
```typescript
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
```

- [x] **Step 3: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 4: Commit**

```bash
git add app/(app)/index.tsx
git commit -m "feat(home): replace Zustand mock schedules with useSchedules API query"
```

---

## Phase 4 — Create Schedule

### Task 9: Wire create-schedule screen

**Files:**
- Modify: `app/(app)/create-schedule.tsx`

- [x] **Step 1: Read the current file**

Read `app/(app)/create-schedule.tsx` fully before editing to understand all existing state and form logic.

- [x] **Step 2: Replace handleCreate with mutation**

Find `handleCreate()` (currently uses `addSchedule` from `useScheduleStore`) and replace it:

```typescript
import { useCreateSchedule } from '@/lib/queries/schedules';
// at component top:
const createSchedule = useCreateSchedule();

function handleCreate(): void {
  const trimmedName = name.trim();
  if (!trimmedName) {
    setNameError(true);
    return;
  }
  createSchedule.mutate(
    {
      title: trimmedName,
      description: description.trim() || null,
      scheduleType: selectedType,
      startWeek: format(weekStart, 'yyyy-MM-dd'),
      memberPermission: selectedPermission,
      iconBg: selectedColor,
    },
    {
      onSuccess: (schedule) => {
        router.replace(`/schedule-created?id=${schedule.id}&inviteCode=${schedule.inviteCode}&title=${encodeURIComponent(schedule.title)}`);
      },
      onError: (err) => {
        showToast(err.message ?? 'Failed to create schedule', 'error');
      },
    },
  );
}
```

Also remove the import of `useScheduleStore` and `addSchedule` from this file.

- [x] **Step 3: Disable button while pending**

Add `disabled={createSchedule.isPending}` to the submit button and show `ActivityIndicator` when `createSchedule.isPending`.

- [x] **Step 4: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 5: Commit**

```bash
git add app/(app)/create-schedule.tsx
git commit -m "feat(create-schedule): replace Zustand mock with useCreateSchedule mutation"
```

---

### Task 10: Update schedule-created screen

**Files:**
- Modify: `app/(app)/schedule-created.tsx`

- [x] **Step 1: Read the current file**

Read `app/(app)/schedule-created.tsx` fully.

- [x] **Step 2: Replace Zustand read with navigation params**

The create screen now passes `id`, `inviteCode`, and `title` as URL params. Read them via `useLocalSearchParams`:

```typescript
import { useLocalSearchParams } from 'expo-router';

// inside component:
const { id, inviteCode, title } = useLocalSearchParams<{
  id: string;
  inviteCode: string;
  title: string;
}>();
```

Replace all references to `schedule.inviteCode`, `schedule.title`, `schedule.id` with the params.

Remove the import of `useScheduleStore` from this file.

- [x] **Step 3: Handle missing params**

Add a guard at the top of the component:

```typescript
if (!id || !inviteCode || !title) {
  return null; // should never happen
}
```

- [x] **Step 4: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 5: Commit**

```bash
git add app/(app)/schedule-created.tsx
git commit -m "feat(schedule-created): read id/inviteCode from nav params instead of Zustand"
```

---

## Phase 5 — Join Schedule

### Task 11: Wire join-schedule screen

**Files:**
- Modify: `app/join-schedule.tsx`

- [x] **Step 1: Read the current file**

Read `app/join-schedule.tsx` fully.

- [x] **Step 2: Replace mock search with useScheduleLookup**

```typescript
import { useScheduleLookup, useJoinSchedule } from '@/lib/queries/schedules';
// at component top:
const lookup = useScheduleLookup();
const join = useJoinSchedule();

// Replace handleSearch():
function handleSearch() {
  if (code.trim().length !== 6) {
    setError('Invite code must be exactly 6 characters.');
    return;
  }
  setError(null);
  lookup.mutate(code.trim().toUpperCase(), {
    onSuccess: (data) => {
      setFound(true);
      setPreview(data);
    },
    onError: (err) => {
      if (err.message === 'already_member') {
        setJoined(true);
      } else {
        setError('Invalid invite code. Please check with your manager.');
      }
    },
  });
}

// Replace handleJoin():
function handleJoin() {
  join.mutate(code.trim().toUpperCase(), {
    onSuccess: () => {
      router.back();
    },
    onError: (err) => {
      setError(err.message ?? 'Failed to join schedule.');
    },
  });
}
```

- [x] **Step 3: Add preview state for API response**

```typescript
const [preview, setPreview] = useState<{
  scheduleName: string;
  managerName: string;
  memberCount: number;
} | null>(null);
```

Replace all references to `MOCK_SCHEDULE_PREVIEW` with `preview`.

- [x] **Step 4: Remove all mock constants**

Delete:
```typescript
const MOCK_INVALID_CODE = '000000';
const MOCK_JOINED_CODE  = '111111';
const MOCK_SCHEDULE_PREVIEW = { ... };
```

- [x] **Step 5: Replace loading state**

Replace `isLoading` local state with `lookup.isPending` or `join.isPending` where appropriate.

- [x] **Step 6: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 7: Commit**

```bash
git add app/join-schedule.tsx
git commit -m "feat(join-schedule): replace setTimeout mock with useScheduleLookup + useJoinSchedule"
```

---

## Phase 6 — Schedule Detail

### Task 12: Wire schedule detail screen

**Files:**
- Modify: `app/(app)/schedule/[id].tsx`

- [x] **Step 1: Read the current file**

Read `app/(app)/schedule/[id].tsx` fully.

- [x] **Step 2: Replace Zustand schedule/shifts/employees reads**

Find all uses of `useScheduleStore()` that read `schedules`, `shiftsBySchedule`, `employeesBySchedule`. Replace with:

```typescript
import { useScheduleDetail, useAddNextWeek, useRenameSchedule, useLeaveSchedule } from '@/lib/queries/schedules';
import { useLocalSearchParams } from 'expo-router';

// inside component:
const { id } = useLocalSearchParams<{ id: string; weekStart?: string }>();
const [selectedWeek, setSelectedWeek] = useState<string | undefined>(undefined);
const { data: schedule, isLoading } = useScheduleDetail(id ?? '', selectedWeek);

const employees = schedule?.employees ?? [];
const shifts = schedule?.shifts ?? [];
const currentUserRole = schedule?.currentUserRole ?? 'Member';
```

- [x] **Step 3: Wire rename mutation**

```typescript
const rename = useRenameSchedule(id ?? '');

// in onConfirm callback for rename:
onConfirm={(newName) => {
  rename.mutate(newName, {
    onSuccess: () => showToast('Schedule renamed', 'success'),
    onError: (err) => showToast(err.message ?? 'Rename failed', 'error'),
  });
}}
```

- [x] **Step 4: Wire leave mutation**

```typescript
const leave = useLeaveSchedule(id ?? '');

// in onConfirm for leave:
onConfirm={() => {
  setLeaveConfirmVisible(false);
  leave.mutate(undefined, {
    onSuccess: () => {
      showToast('You have left the schedule', 'success');
      router.back();
    },
    onError: (err) => showToast(err.message ?? 'Failed to leave', 'error'),
  });
}}
```

- [x] **Step 5: Wire add next week mutation**

```typescript
const addNextWeek = useAddNextWeek(id ?? '');

// in the "+ Next Week" button handler:
function handleAddNextWeek() {
  addNextWeek.mutate(undefined, {
    onSuccess: (data) => {
      setSelectedWeek(data.currentWeek);
      showToast('Next week added', 'success');
    },
    onError: (err) => showToast(err.message ?? 'Failed to add week', 'error'),
  });
}
```

- [x] **Step 6: Add loading state**

```typescript
if (isLoading) {
  return (
    <View className="flex-1 items-center justify-center bg-[#f8f8f6]">
      <ActivityIndicator size="large" color="#b6ec13" />
    </View>
  );
}
```

- [x] **Step 7: Remove useScheduleStore imports that read schedule data**

Keep `useScheduleStore` only if it's still used for `pendingToast`, `showNewScheduleSheet`, etc. Otherwise remove it entirely from this file.

- [x] **Step 8: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 9: Commit**

```bash
git add "app/(app)/schedule/[id].tsx"
git commit -m "feat(schedule-detail): replace Zustand mock with useScheduleDetail + action mutations"
```

---

## Phase 7 — Shifts CRUD

### Task 13: Create shift mutations

**Files:**
- Create: `src/lib/queries/shifts.ts`

- [x] **Step 1: Create the file**

```typescript
// src/lib/queries/shifts.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import type { Shift, ShiftType } from '@/types/schedule';
import { scheduleKeys } from './schedules';

interface ShiftResponse {
  id: string;
  employeeId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
}

export function useAddShift(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      employeeId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      shiftType: ShiftType;
    }) => apiPost<ShiftResponse>(`/schedules/${scheduleId}/shifts`, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) }),
  });
}

export function useUpdateShift(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      shiftId: string;
      startTime: string;
      endTime: string;
      shiftType: ShiftType;
    }) =>
      apiPost<ShiftResponse>(`/shifts/${vars.shiftId}/update`, {
        startTime: vars.startTime,
        endTime: vars.endTime,
        shiftType: vars.shiftType,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) }),
  });
}

export function useDeleteShift(scheduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shiftId: string) =>
      apiPost<{ ok: boolean }>(`/shifts/${shiftId}/delete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKeys.detail(scheduleId) }),
  });
}
```

- [x] **Step 2: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 3: Commit**

```bash
git add src/lib/queries/shifts.ts
git commit -m "feat(queries): add useAddShift, useUpdateShift, useDeleteShift hooks"
```

---

### Task 14: Wire shift mutations into AddEditShiftBottomSheet

**Files:**
- Modify: The component that handles add/edit/delete shift UI (find via `Grep`)

- [x] **Step 1: Find the component**

```bash
cd lymoon-mobile && grep -r "addShiftToSchedule\|updateShiftInSchedule\|deleteShiftFromSchedule" src/ app/ --include="*.tsx" -l
```

- [x] **Step 2: Read the found file**

Read the file found above fully.

- [x] **Step 3: Replace Zustand shift mutations**

For each of `addShiftToSchedule`, `updateShiftInSchedule`, `deleteShiftFromSchedule`, replace the Zustand store call with the corresponding TanStack Query mutation from `src/lib/queries/shifts.ts`.

The component must receive `scheduleId` as a prop (or read it from context/params).

Example for add:
```typescript
import { useAddShift } from '@/lib/queries/shifts';
// inside component, receiving scheduleId prop:
const addShift = useAddShift(scheduleId);

// where addShiftToSchedule was called:
addShift.mutate(
  { employeeId: config.employeeId, dayOfWeek: config.dayOfWeek, startTime, endTime, shiftType },
  {
    onSuccess: () => { onClose(); showToast('Shift added', 'success'); },
    onError: (err) => showToast(err.message ?? 'Failed to add shift', 'error'),
  },
);
```

- [x] **Step 4: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 5: Commit**

```bash
git add -p  # stage only the modified shift component file
git commit -m "feat(shifts): wire AddEditShiftBottomSheet to real API mutations"
```

---

## Phase 8 — Members & Work Hours

### Task 15: Wire members list and work hours UI

**Files:**
- Modify: Components in `app/(app)/schedule/[id].tsx` or any member/work-hours bottom sheet

- [x] **Step 1: Find member list and work hours components**

```bash
cd lymoon-mobile && grep -r "MOCK_WORK_HOURS\|membersOf\|employeesBySchedule" app/ src/ --include="*.tsx" -l
```

- [x] **Step 2: Read the found files**

Read each file found.

- [x] **Step 3: Wire useScheduleMembers**

Find wherever member list is rendered and replace Zustand/mock data with:

```typescript
import { useScheduleMembers } from '@/lib/queries/schedules';
const { data: members = [], isLoading: membersLoading } = useScheduleMembers(scheduleId);
```

- [x] **Step 4: Wire useWorkHours**

Find wherever `MOCK_WORK_HOURS_HISTORY` is used and replace with:

```typescript
import { useWorkHours } from '@/lib/queries/schedules';
const { data: workHours = [] } = useWorkHours(scheduleId, targetUserId);
// workHours is: { weekStart: string; weekEnd: string; totalHours: number }[]
```

Render `workHours[i].totalHours` instead of the mock array values.

- [x] **Step 5: Wire useRemoveMember**

Find wherever `removeSchedule` / member removal Zustand call happens, replace with:

```typescript
import { useRemoveMember } from '@/lib/queries/schedules';
const removeMember = useRemoveMember(scheduleId);

removeMember.mutate(userId, {
  onSuccess: () => showToast('Member removed', 'success'),
  onError: (err) => showToast(err.message ?? 'Failed to remove member', 'error'),
});
```

- [x] **Step 6: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 7: Commit**

```bash
git add -p
git commit -m "feat(members): wire members list and work hours to real API"
```

---

## Phase 9 — Notifications

### Task 16: Create notification hooks

**Files:**
- Create: `src/lib/queries/notifications.ts`

- [x] **Step 1: Create the file**

```typescript
// src/lib/queries/notifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationKeys = {
  all: ['notifications'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => apiGet<Notification[]>('/notifications'),
    refetchInterval: 30_000, // poll every 30 seconds
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      apiPost<{ ok: boolean }>('/notifications/read', { notificationIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
```

- [x] **Step 2: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 3: Commit**

```bash
git add src/lib/queries/notifications.ts
git commit -m "feat(queries): add useNotifications (polling) and useMarkNotificationsRead hooks"
```

---

### Task 17: Wire notifications screen

**Files:**
- Modify: `app/(app)/notifications/index.tsx`

- [x] **Step 1: Read the current file**

Read `app/(app)/notifications/index.tsx` fully.

- [x] **Step 2: Replace any mock/empty data with hooks**

```typescript
import { useNotifications, useMarkNotificationsRead } from '@/lib/queries/notifications';

// inside component:
const { data: notifications = [], isLoading } = useNotifications();
const markRead = useMarkNotificationsRead();

function handleMarkAllRead() {
  const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
  if (unreadIds.length === 0) return;
  markRead.mutate(unreadIds);
}
```

- [x] **Step 3: Render the real notifications list**

Map over `notifications` array to render each item. Show `isLoading` state with `ActivityIndicator`. If `notifications.length === 0`, show empty state.

- [x] **Step 4: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

- [x] **Step 5: Commit**

```bash
git add app/(app)/notifications/index.tsx
git commit -m "feat(notifications): wire notifications screen to real API with 30s polling"
```

---

## Phase 10 — Mock Data Cleanup

### Task 18: Strip scheduleStore to UI-only state

**Files:**
- Modify: `src/stores/scheduleStore.ts`

- [x] **Step 1: Replace the entire file**

```typescript
// src/stores/scheduleStore.ts
import { create } from 'zustand';

interface ScheduleUIState {
  pendingToast: string | null;
  showNewScheduleSheet: boolean;
  clearPendingToast: () => void;
  setShowNewScheduleSheet: (visible: boolean) => void;
  setPendingToast: (message: string) => void;
}

export const useScheduleStore = create<ScheduleUIState>((set) => ({
  pendingToast: null,
  showNewScheduleSheet: false,
  clearPendingToast: () => set({ pendingToast: null }),
  setShowNewScheduleSheet: (visible) => set({ showNewScheduleSheet: visible }),
  setPendingToast: (message) => set({ pendingToast: message }),
}));
```

- [x] **Step 2: Verify — expect type errors in callers**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -60
```

Fix any remaining callers that still try to call `addSchedule`, `removeSchedule`, `addShiftToSchedule`, `updateShiftInSchedule`, `deleteShiftFromSchedule`, `shiftsBySchedule`, or `employeesBySchedule`. Each of these should already be replaced by mutations/queries in earlier tasks. If any remain, replace them now.

- [x] **Step 3: Verify clean**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```
Expected: zero errors.

- [x] **Step 4: Commit**

```bash
git add src/stores/scheduleStore.ts
git commit -m "chore: strip scheduleStore to UI-only state (pendingToast, showNewScheduleSheet)"
```

---

### Task 19: Remove mock constants

**Files:**
- Modify: `src/features/schedule/constants.ts`

- [x] **Step 1: Read the file**

Read `src/features/schedule/constants.ts` fully.

- [x] **Step 2: Remove mock exports**

Delete these exports:
- `MOCK_EMPLOYEES`
- `MOCK_SHIFTS`
- `MOCK_WORK_HOURS_HISTORY`
- `ENGINEERING_SPRINT_TEMPLATE`

Keep non-mock constants: `SCHEDULE_CATEGORIES`, any color tokens, any UI constants.

- [x] **Step 3: Verify**

```bash
cd lymoon-mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors (all callers were already updated in previous tasks).

- [x] **Step 4: Commit**

```bash
git add src/features/schedule/constants.ts
git commit -m "chore: remove MOCK_EMPLOYEES, MOCK_SHIFTS, MOCK_WORK_HOURS_HISTORY, ENGINEERING_SPRINT_TEMPLATE"
```

---

## Self-Review Checklist

### Spec coverage

| Requirement | Task(s) |
|-------------|---------|
| `POST /api/auth/login` wired | Task 5 |
| `POST /api/auth/register` wired | Task 6 |
| `GET /api/schedules` replaces Zustand mock | Task 8 |
| `POST /api/schedules` replaces Zustand mock | Task 9 |
| Schedule-created screen reads from nav params | Task 10 |
| `GET /api/schedules/lookup` replaces setTimeout mock | Task 11 |
| `POST /api/schedules/join` replaces Zustand mock | Task 11 |
| `GET /api/schedules/{id}` replaces Zustand mock | Task 12 |
| `POST /api/schedules/{id}/rename` wired | Task 12 |
| `POST /api/schedules/{id}/leave` wired | Task 12 |
| `POST /api/schedules/{id}/weeks` wired | Task 12 |
| `POST /api/schedules/{id}/shifts` wired | Task 14 |
| `POST /api/shifts/{id}/update` wired | Task 14 |
| `POST /api/shifts/{id}/delete` wired | Task 14 |
| `GET /api/schedules/{id}/members` wired | Task 15 |
| `GET /api/schedules/{id}/members/{userId}/work-hours` wired | Task 15 |
| `POST /api/schedules/{id}/members/remove` wired | Task 15 |
| `GET /api/notifications` polled every 30s | Task 16–17 |
| `POST /api/notifications/read` wired | Task 17 |
| All mock data removed | Tasks 18–19 |
| `authStore` holds real JWT | Task 3 |

### Out of scope (separate plan if needed)
- Google/Apple Sign In (`POST /api/auth/google`, `/apple`) — backend Step 2b not yet complete; screens still show "coming soon" alerts
- Token persistence across app restarts (SecureStore) — MVP deferred
- Settings and Calendar screens — still "Coming soon" placeholders
