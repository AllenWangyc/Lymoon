# Toast Notification Component — Design Spec

**Date:** 2026-03-18
**Status:** Approved
**Project:** Lymoon Mobile (Expo + React Native + NativeWind)

---

## Overview

A top-sliding Toast notification banner component for in-app feedback after Schedule-related operations (create, join, edit, leave). No overlay/backdrop. Dismissible via X button or auto-timeout.

---

## Use Cases

- Schedule created successfully
- Schedule joined successfully
- Schedule edited successfully
- Left a schedule successfully
- Any future success/error feedback needing lightweight notification

---

## Visual Design

- **Position:** Fixed, `top = insets.top + 8` (using `useSafeAreaInsets()` from `react-native-safe-area-context`, already in project), horizontally `mx-4`
- **Card:** White background, `border border-[#f1f5f9]`, `rounded-[16px]`, `shadow-md` (NativeWind class; renders as `shadowColor/shadowOffset/shadowOpacity/shadowRadius` on iOS and `elevation` on Android)
- **Layout (left → right):**
  1. Icon (`Ionicons`, 22px, filled variant) — colored by type
  2. Message text — `text-[16px] font-bold text-[#0f172a]`, no subtitle, `flex-1`
  3. X close button — `Ionicons close` (filled), `#94a3b8`
- **Types:**
  - `success` → `checkmark-circle` icon, color `#b6ec13`
  - `error` → `close-circle` icon, color `#ef4444`
- **Animation:**
  - Initial `Animated.Value`: `-200` (safely above viewport, regardless of card height)
  - Slide in: `-200 → 0`, 300ms, `useNativeDriver: true`
  - Slide out (both auto-dismiss and manual X close): `0 → -200`, 250ms
  - `Toast` component is **always mounted** — visibility is driven entirely by `translateY` position, never by returning `null`

---

## Architecture

### File Structure

```
lymoon-mobile/src/
  components/
    Toast.tsx              # Pure presentational component (always mounted)
  providers/
    ToastProvider.tsx      # Context, state, animation logic, auto-dismiss timer
  hooks/
    useToast.ts            # Exposes showToast() to callers

lymoon-mobile/app/
  (app)/
    _layout.tsx            # Wrap children with <ToastProvider> (existing file)
```

### Context Shape

`ToastProvider` exposes only `showToast` via context. Internal state (`visible`, `message`, `type`, `translateY`) is not exposed — callers have no need to read toast state.

`ToastProvider` is also responsible for computing `topOffset = insets.top + 8` via `useSafeAreaInsets()` and passing it to `Toast.tsx` as a prop. `Toast.tsx` does not call any hooks.

```ts
interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error', duration?: number) => void;
}
```

### Data Flow

```
Caller → showToast(message, type?, duration?)
  → ToastProvider: cancel any in-progress animation/timer
  → translateY.setValue(-200)        ← hard reset to off-screen
  → Set state { message, type }
  → Slide-in animation (-200 → 0, 300ms)
  → After duration ms (default: 3000ms): run dismiss()
```

### `dismiss()` helper (shared by auto-dismiss and manual close)

No `visible` state needed — component stays mounted at `-200` when not shown.

```
dismiss():
  1. clearTimeout(timerRef.current)
  2. animationRef.current?.stop()
  3. Animated.timing(translateY, { toValue: -200, duration: 250 }).start()
```

### Timer and Animation Race Condition

When a new `showToast` fires while a previous toast is visible or animating:
1. `clearTimeout` on the existing auto-dismiss timer ref
2. `animationRef.current?.stop()` on any running `Animated.timing`
3. `translateY.setValue(-200)` — explicit hard reset to off-screen position
4. Start fresh slide-in animation + new timer

### Manual Close Behavior

Tapping X calls `dismiss()` — same path as auto-dismiss.

### Unmount Cleanup

`useEffect` cleanup (on unmount):
1. `clearTimeout(timerRef.current)`
2. `animationRef.current?.stop()` — prevents completion callbacks from calling setState on unmounted component

---

## API

### `showToast(message, type?, duration?)`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `message` | `string` | required | Notification text |
| `type` | `'success' \| 'error'` | `'success'` | Controls icon and accent color |
| `duration` | `number` | `3000` | Auto-dismiss delay in ms |

### `Toast` Component Props

```ts
type ToastProps = {
  visible: boolean;
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  translateY: Animated.Value;
  topOffset: number;
};
```

---

## Implementation Constraints

- Use `Animated` from React Native (not Reanimated — not installed)
- Use `@expo/vector-icons` Ionicons, **filled** variants (`checkmark-circle`, `close-circle`, `close`)
- Use NativeWind classes for all styling; use `shadow-md` for card shadow
- Inline `style` prop only for `transform: [{ translateY }]` and `top` offset
- Timer ref (`useRef<ReturnType<typeof setTimeout>>`) must be cleared on unmount via `useEffect` cleanup
- Only one toast visible at a time; new call replaces current (cancel + reset)

---

## Out of Scope

- Push notifications
- Notification center / history list
- Swipe-to-dismiss gesture
- Stacked / queued toasts
