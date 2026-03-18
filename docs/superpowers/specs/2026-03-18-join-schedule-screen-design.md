# Join Schedule Screen — Design Spec

**Date:** 2026-03-18
**Feature:** Join Schedule full-screen page
**Trigger:** User taps "Join with Code" in `NewScheduleBottomSheet`

---

## Overview

A full-screen stack page that allows a user to enter a 6-character alphanumeric invite code to join a team's schedule. The core interaction is a split OTP-style input with auto-uppercase, paste support, and backspace behavior. The Search button is disabled until all 6 characters are entered. In this phase, the Search button press has no visible user-facing effect — it only logs to the console.

---

## Files

| File | Action |
|------|--------|
| `app/join-schedule.tsx` | New — full-screen route at root Stack level |
| `src/components/OTPInput.tsx` | New — reusable 6-char input component |
| `src/features/schedule/components/NewScheduleBottomSheet.tsx` | Modify — differentiate Create vs Join option |
| `app/(app)/index.tsx` | Modify — update `onSelect` handler (only call site) |

No new dependencies required.

---

## Navigation Architecture

The root `app/_layout.tsx` is a `Stack` navigator (`headerShown: false`). The `(app)` group is a nested Tabs navigator within it.

`join-schedule.tsx` is placed at `app/join-schedule.tsx` — a root Stack screen. This ensures:
- No tab bar shown (full-screen experience)
- Accessible via `router.push('/join-schedule')` from anywhere in the app
- No changes needed to any layout file

---

## OTPInput Component

### Interface

```ts
interface OTPInputProps {
  value: string;           // Current input string, max 6 chars
  onChange: (val: string) => void;
  autoFocus?: boolean;
}
```

### Implementation Strategy

Uses a **single hidden TextInput** overlaid behind 6 display Views. This is the most reliable approach for cross-platform paste handling and backspace behavior.

- Hidden `TextInput` is positioned absolutely over the full width of the 6-cell container, with `opacity: 0` and `color: transparent`
- `autoCapitalize="characters"` is set as a keyboard hint only — it does not guarantee uppercase on all platforms
- `onChangeText` handler is the authoritative enforcement: `.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)`
- Each display View renders `value[i]` or empty
- Tapping any display View calls `.focus()` on the hidden TextInput ref
- `isFocused` state is tracked via `onFocus` / `onBlur` on the hidden TextInput

### Cell States

| State | Border Color | Border Width | Background | Glow |
|-------|-------------|--------------|------------|------|
| Empty / inactive | `#e2e8f0` | 2px | `#f8fafc` | None |
| Active (focused + current position) | `#22c55e` | 2px | `#f8fafc` | `shadowColor: #22c55e`, `shadowOpacity: 0.3`, `shadowRadius: 8`, `elevation: 4` |
| Filled / inactive | `#e2e8f0` | 2px | `#f8fafc` | None |

**Active cell logic:** The active (highlighted) cell is `Math.min(value.length, 5)` — always the first empty cell, capped at index 5 when all 6 characters are filled. Cell 5 remains highlighted while the input is focused and fully filled, acting as a "ready to submit" indicator. Active styling only applies when `isFocused === true`; on blur, all cells revert to the inactive style.

### Cell Dimensions & Layout

- Each cell: width 52px, height 72px, border-radius 12px
- Container: `flexDirection: 'row'`, `justifyContent: 'space-between'`, `width: '100%'`
- No fixed pixel width on the container — adapts to available screen width with `paddingHorizontal: 24` applied by the parent screen

---

## join-schedule.tsx Screen

### Layout (top to bottom)

1. **Header**
   - Back button (←) top-left, triggers `router.back()`
   - Title: "Join Schedule" — bold, 30px, `#0f172a`
   - Subtitle: "Enter your invitation code" — regular, 16px, `#64748b`

2. **Team Icon**
   - 48×48 circle, `bg: #f1f5f9`, centered
   - People/team icon inside (use a simple SVG or Ionicons `people-outline`)

3. **OTPInput**
   - `autoFocus={true}`
   - `value` and `onChange` wired to local `useState<string>('')`

4. **Search Button**
   - Full width, height 64px, border-radius 16px
   - Active: background `#b6ec13`, text `#0f172a` bold 18px, lime glow shadow
   - Disabled: `opacity: 0.4`, non-interactive (`disabled` prop)
   - Enabled condition: `code.length === 6`
   - `onPress`: `console.log('Join schedule with code:', code)` — **no visible user-facing effect in this phase**

5. **Cancel Button**
   - Text only, 16px semi-bold, `#64748b`, calls `router.back()`

6. **Help Hint**
   - Pill-shaped row, `bg: #f1f5f9`, horizontal padding 16px, vertical 8px, border-radius 9999
   - Icon (info/circle-outline) + text: "Need help joining a team? Contact your manager"

### State

```ts
const [code, setCode] = useState('');
```

No additional state needed for this phase.

---

## NewScheduleBottomSheet Changes

`NewScheduleBottomSheet` is only consumed in `app/(app)/index.tsx` — one call site.

### Prop signature change

```ts
// Before
onSelect: () => void

// After
onSelect: (type: 'create' | 'join') => void
```

### Internal behavior

Both option buttons pass their type to `onSelect`. The bottom sheet then calls `onClose()`. These fire sequentially — `onSelect(type)` first, `onClose()` second — so the parent can queue navigation after the sheet begins dismissing.

### Home screen handler update (`index.tsx`)

```ts
const handleScheduleOption = (type: 'create' | 'join') => {
  if (type === 'join') {
    router.push('/join-schedule');
  } else {
    // existing create logic unchanged
  }
};
```

Navigation is pushed after `onSelect` fires. The sheet dismissal animation and stack push animation run concurrently — this is standard behavior in React Native and is visually acceptable.

---

## Validation Rules

- Only `/[A-Z0-9]/` characters accepted (enforced in `onChangeText`, not by `autoCapitalize`)
- All alphabetic input forced to uppercase via `.toUpperCase()`
- Maximum length: 6 characters (enforced via `.slice(0, 6)`)
- Search button active only when `code.length === 6`

---

## Out of Scope (this phase)

- API call to `POST /api/teams/join`
- Team confirmation or result screen
- Error handling for invalid or expired codes
- Loading state on Search button
- The Search button press has **no visible user-facing effect** in this phase
