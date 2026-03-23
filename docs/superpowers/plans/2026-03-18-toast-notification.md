# Toast Notification Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a top-sliding Toast notification banner that can be triggered from any screen after Schedule operations (create, join, edit, leave).

**Architecture:** A `ToastProvider` wraps the app layout and manages animation + timer state internally. Any screen calls `showToast()` via `useToast()` hook. A pure presentational `Toast` component renders the visible card — always mounted, never returns null (returning null would unmount Animated.View and reset the value, causing a flicker on next show).

**Tech Stack:** React Native `Animated`, `@expo/vector-icons` Ionicons, NativeWind v4, `react-native-safe-area-context`, React Context API.

**Spec:** `docs/superpowers/specs/2026-03-18-toast-notification-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lymoon-mobile/src/components/Toast.tsx` | Pure presentational card: icon, message, X button |
| Create | `lymoon-mobile/src/providers/ToastProvider.tsx` | Context, Animated value, state, timer, dismiss logic |
| Create | `lymoon-mobile/src/hooks/useToast.ts` | Exposes `showToast()` to callers |
| Modify | `lymoon-mobile/app/(app)/_layout.tsx` | Wrap `<Tabs>` with `<ToastProvider>` |

---

## Task 1: `Toast.tsx` — Presentational Component

**Files:**
- Create: `lymoon-mobile/src/components/Toast.tsx`

**Important:** The component is always mounted. It is positioned off-screen at `translateY(-200)` when hidden and slides to `translateY(0)` when visible. Do NOT return `null` based on `visible` — that would unmount the `Animated.View` and reset the `Animated.Value`.

- [ ] **Step 1: Create the file**

```tsx
// lymoon-mobile/src/components/Toast.tsx
import { Animated, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastProps = {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  translateY: Animated.Value;
  topOffset: number;
};

export function Toast({ message, type = 'success', onClose, translateY, topOffset }: ToastProps) {
  const iconName = type === 'success' ? 'checkmark-circle' : 'close-circle';
  const iconColor = type === 'success' ? '#b6ec13' : '#ef4444';

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY }],
          top: topOffset,
          position: 'absolute',
          left: 16,
          right: 16,
          zIndex: 999,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 6,
        },
      ]}
      className="bg-white border border-[#f1f5f9] rounded-[16px] flex-row items-center px-4 py-3 gap-3"
    >
      <Ionicons name={iconName} size={22} color={iconColor} />
      <Text className="flex-1 text-[16px] font-bold text-[#0f172a]">{message}</Text>
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color="#94a3b8" />
      </TouchableOpacity>
    </Animated.View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add lymoon-mobile/src/components/Toast.tsx
git commit -m "feat(toast): add Toast presentational component"
```

---

## Task 2: `ToastProvider.tsx` — Context, Animation, Timer

**Files:**
- Create: `lymoon-mobile/src/providers/ToastProvider.tsx`

**Two separate refs:**
- `translateY` — an `Animated.Value`, initialized to `-200` (safely off-screen). Call `translateY.setValue(-200)` to hard-reset position.
- `animationRef` — stores the current `Animated.CompositeAnimation` returned by `Animated.timing(...)`. Used to `.stop()` in-flight animations. Initialized as `useRef<Animated.CompositeAnimation | null>(null)`.

- [ ] **Step 1: Create the file**

```tsx
// lymoon-mobile/src/providers/ToastProvider.tsx
import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from '@/components/Toast';

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error', duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const topOffset = insets.top + 8;

  // Animated.Value for position — kept alive for the lifetime of the provider.
  // -200 ensures it starts fully off-screen regardless of card height.
  const translateY = useRef(new Animated.Value(-200)).current;

  // Stores the current running animation so it can be stopped on replacement or unmount.
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Auto-dismiss timer ref.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error'>('success');

  // Cleanup on unmount — stop any in-flight animation so its callback
  // does not call setState on an unmounted component.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      animationRef.current?.stop();
    };
  }, []);

  // Shared dismiss path — used by auto-dismiss timer AND manual X press.
  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    animationRef.current?.stop();

    const anim = Animated.timing(translateY, {
      toValue: -200,
      duration: 250,
      useNativeDriver: true,
    });
    animationRef.current = anim;
    // No state update needed — component stays mounted at -200 (off-screen).
    anim.start();
  }, [translateY]);

  const showToast = useCallback(
    (msg: string, toastType: 'success' | 'error' = 'success', duration = 3000) => {
      // Cancel any in-progress animation and timer.
      if (timerRef.current) clearTimeout(timerRef.current);
      animationRef.current?.stop();
      // Hard-reset position to off-screen before starting fresh slide-in.
      translateY.setValue(-200);

      setMessage(msg);
      setType(toastType);

      const anim = Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      });
      animationRef.current = anim;
      anim.start();

      timerRef.current = setTimeout(dismiss, duration);
    },
    [translateY, dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        message={message}
        type={type}
        onClose={dismiss}
        translateY={translateY}
        topOffset={topOffset}
      />
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add lymoon-mobile/src/providers/ToastProvider.tsx
git commit -m "feat(toast): add ToastProvider with animation and auto-dismiss"
```

---

## Task 3: `useToast.ts` — Public Hook

**Files:**
- Create: `lymoon-mobile/src/hooks/useToast.ts`

- [ ] **Step 1: Create the hook**

```ts
// lymoon-mobile/src/hooks/useToast.ts
import { useToastContext } from '@/providers/ToastProvider';

export function useToast() {
  return useToastContext();
}
```

- [ ] **Step 2: Commit**

```bash
git add lymoon-mobile/src/hooks/useToast.ts
git commit -m "feat(toast): add useToast hook"
```

---

## Task 4: Wire `ToastProvider` into Root Layout

**Files:**
- Modify: `lymoon-mobile/app/(app)/_layout.tsx`

This is the authenticated app layout. Placing `ToastProvider` here means toasts work on all tabs but not on auth screens — which is the correct scope.

Current file (`lymoon-mobile/app/(app)/_layout.tsx`):
```tsx
import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/CustomTabBar';

export default function AppLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="team" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
```

- [ ] **Step 1: Wrap `<Tabs>` with `<ToastProvider>`**

```tsx
import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/CustomTabBar';
import { ToastProvider } from '@/providers/ToastProvider';

export default function AppLayout() {
  return (
    <ToastProvider>
      <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="calendar" />
        <Tabs.Screen name="team" />
        <Tabs.Screen name="settings" />
      </Tabs>
    </ToastProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add lymoon-mobile/app/(app)/_layout.tsx
git commit -m "feat(toast): wire ToastProvider into app layout"
```

---

## Task 5: Smoke Test in Home Screen

Verify the toast works end-to-end by temporarily wiring it to the "New" schedule button. **This wiring is a smoke test only — it will be replaced by real integration in follow-up tasks.**

**Files:**
- Modify: `lymoon-mobile/app/(app)/index.tsx`

- [ ] **Step 1: Add `showToast` call in `handleAddSchedule`**

Add the import at the top of the file:
```tsx
import { useToast } from '@/hooks/useToast';
```

Inside `HomeScreen`, add the hook and update `handleAddSchedule`:
```tsx
const { showToast } = useToast();

function handleAddSchedule() {
  setSchedules((prev) => [
    ...prev,
    { ...ENGINEERING_SPRINT_TEMPLATE, id: String(Date.now()) },
  ]);
  showToast('Schedule created successfully');
}
```

- [ ] **Step 2: Run the app and verify**

```bash
cd lymoon-mobile && npx expo start
```

Expected behavior:
1. Tap the "New" button on the Home screen
2. A white card slides in from the top with a green checkmark icon and "Schedule created successfully"
3. Toast auto-dismisses after 3 seconds with a slide-out
4. Tapping the X button dismisses immediately with slide-out animation
5. Tapping "New" again while a toast is visible replaces it cleanly (no flicker, no double-timer)

- [ ] **Step 3: Commit smoke test wiring**

```bash
git add lymoon-mobile/app/(app)/index.tsx
git commit -m "test(toast): smoke test showToast on schedule creation"
```

---

## Done

All four files in place. `showToast()` is now available on any screen inside `(app)/` via:

```ts
const { showToast } = useToast();
showToast('Schedule created successfully');             // success, 3s
showToast('Failed to join schedule', 'error');          // error, 3s
showToast('Left schedule', 'success', 4000);            // success, 4s
```
