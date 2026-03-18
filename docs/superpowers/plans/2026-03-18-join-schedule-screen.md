# Join Schedule Screen Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full-screen "Join Schedule" page triggered by "Join with Code" in NewScheduleBottomSheet, featuring a 6-character alphanumeric OTP input with auto-uppercase, paste support, backspace navigation, and a focus-state green glow effect.

**Architecture:** Single hidden `TextInput` overlaid behind 6 display `View` cells handles all keyboard input; the display layer reads from a controlled `string` state and renders per-cell styling. The screen lives at `app/join-schedule.tsx` (root Stack level) so no tab bar is shown.

**Tech Stack:** Expo Router v3, React Native, NativeWind v4, TypeScript, `@expo/vector-icons` (Ionicons), `react-native-safe-area-context`

**Spec:** `docs/superpowers/specs/2026-03-18-join-schedule-screen-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lymoon-mobile/src/components/OTPInput.tsx` | Create | Reusable 6-cell alphanumeric input component |
| `lymoon-mobile/app/join-schedule.tsx` | Create | Full-screen Join Schedule route |
| `lymoon-mobile/src/components/NewScheduleBottomSheet.tsx` | Modify | Add `type` param to `onSelect` callback |
| `lymoon-mobile/app/(app)/index.tsx` | Modify | Wire new `onSelect` signature to navigation |

**NativeWind convention:** All layout and color styling uses NativeWind `className`. Inline `style` is only used where NativeWind has no equivalent (shadow/glow effects with custom colors, `position: 'absolute'` overlays).

---

## Task 1: OTPInput component

**Files:**
- Create: `lymoon-mobile/src/components/OTPInput.tsx`

### Step-by-step

- [ ] **Step 1: Create the component**

Create `lymoon-mobile/src/components/OTPInput.tsx`:

```tsx
import { useRef, useState } from 'react';
import { TextInput, TouchableOpacity, View, Text } from 'react-native';

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
  autoFocus?: boolean;
}

const CELL_COUNT = 6;

export function OTPInput({ value, onChange, autoFocus = false }: OTPInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  function handleChangeText(text: string) {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CELL_COUNT);
    onChange(cleaned);
  }

  // Active cell = first empty slot, capped at last cell.
  // When all 6 are filled and input is focused, last cell stays highlighted
  // as a visual "ready to submit" indicator.
  const activeCellIndex = Math.min(value.length, CELL_COUNT - 1);

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
      <View className="flex-row justify-between w-full">
        {Array.from({ length: CELL_COUNT }).map((_, index) => {
          const isActive = isFocused && index === activeCellIndex;
          return (
            <View
              key={index}
              className="w-[52px] h-[72px] rounded-[12px] border-2 items-center justify-center bg-[#f8fafc]"
              style={[
                { borderColor: isActive ? '#22c55e' : '#e2e8f0' },
                isActive && {
                  shadowColor: '#22c55e',
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 4,
                },
              ]}
            >
              <Text className="text-[24px] font-bold text-[#0f172a]">
                {value[index] ?? ''}
              </Text>
            </View>
          );
        })}

        {/* Hidden TextInput — captures all keyboard input */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          autoFocus={autoFocus}
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType="default"
          caretHidden
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute w-full h-full opacity-0"
          style={{ color: 'transparent' }}
        />
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd lymoon-mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd lymoon-mobile && git add src/components/OTPInput.tsx
git commit -m "feat(otp): add OTPInput component with 6-cell alphanumeric input"
```

---

## Task 2: Join Schedule screen

**Files:**
- Create: `lymoon-mobile/app/join-schedule.tsx`

**Note:** This screen lives at the root Stack level (`app/join-schedule.tsx`), outside the `(app)` Tabs group. The root `app/_layout.tsx` is a `<Stack>` that auto-registers all file-based routes — no explicit registration needed. Import `SafeAreaView` from `react-native-safe-area-context` (not from `react-native`) to correctly handle the Android status bar.

### Step-by-step

- [ ] **Step 1: Create the screen**

Create `lymoon-mobile/app/join-schedule.tsx`:

```tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OTPInput } from '@/components/OTPInput';

export default function JoinScheduleScreen() {
  const [code, setCode] = useState('');

  const canSearch = code.length === 6;

  function handleSearch() {
    console.log('Join schedule with code:', code);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]">
      <View className="flex-1 px-6">

        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-12 w-10 h-10 rounded-full bg-white border border-[#f1f5f9] items-center justify-center"
          style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <Ionicons name="arrow-back" size={16} color="#0f172a" />
        </TouchableOpacity>

        {/* Title block */}
        <View className="mt-10">
          <Text
            className="text-[30px] font-bold text-[#0f172a]"
            style={{ letterSpacing: -0.75 }}
          >
            Join Schedule
          </Text>
          <Text className="text-[16px] text-[#64748b] mt-2">
            Enter your invitation code
          </Text>
        </View>

        {/* Main content area */}
        <View className="mt-4 gap-12">

          {/* Team icon + OTP cells */}
          <View className="gap-4">
            <View className="items-center">
              <View className="w-12 h-12 rounded-full bg-[#f1f5f9] items-center justify-center">
                <Ionicons name="people-outline" size={22} color="#64748b" />
              </View>
            </View>
            <OTPInput value={code} onChange={setCode} autoFocus />
          </View>

          {/* Action buttons */}
          <View className="pt-14 gap-4">
            {/* Search */}
            <TouchableOpacity
              onPress={handleSearch}
              disabled={!canSearch}
              className="h-16 rounded-[16px] items-center justify-center bg-[#b6ec13]"
              style={[
                { shadowColor: '#b6ec13', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
                !canSearch && { opacity: 0.4 },
              ]}
            >
              <Text className="text-[18px] font-bold text-[#0f172a]">Search</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-14 items-center justify-center"
            >
              <Text className="text-[16px] font-semibold text-[#64748b]">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help hint — pinned to bottom */}
        <View className="absolute bottom-12 left-6 right-6 items-center">
          <View className="flex-row items-center gap-2 bg-[#f1f5f9] px-4 py-2 rounded-full">
            <Ionicons name="information-circle-outline" size={14} color="#475569" />
            <Text className="text-[12px] font-medium text-[#475569]">
              Need help joining a team? Contact your manager
            </Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd lymoon-mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd lymoon-mobile && git add app/join-schedule.tsx
git commit -m "feat(join-schedule): add Join Schedule full-screen route"
```

---

## Task 3: Update NewScheduleBottomSheet

**Files:**
- Modify: `lymoon-mobile/src/components/NewScheduleBottomSheet.tsx`

Change `onSelect: () => void` → `onSelect: (type: 'create' | 'join') => void`. Split the single `handleOption` into two typed handlers.

### Step-by-step

- [ ] **Step 1: Update Props interface**

In `src/components/NewScheduleBottomSheet.tsx`, replace lines 5–9:

```tsx
// Before
interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: () => void;
}

// After
interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'create' | 'join') => void;
}
```

- [ ] **Step 2: Replace `handleOption` with two handlers**

Replace lines 29–32:

```tsx
// Before
function handleOption() {
  onSelect();
  onClose();
}

// After
function handleCreate() {
  onSelect('create');
  onClose();
}

function handleJoin() {
  onSelect('join');
  onClose();
}
```

- [ ] **Step 3: Update `onPress` on both option buttons**

- "Create New Schedule" `TouchableOpacity`: change `onPress={handleOption}` → `onPress={handleCreate}`
- "Join with Code" `TouchableOpacity`: change `onPress={handleOption}` → `onPress={handleJoin}`

- [ ] **Step 4: Skip tsc until Task 4 is done**

`index.tsx` still passes `onSelect={handleAddSchedule}` (wrong type), so tsc will fail here. Proceed directly to Task 4.

---

## Task 4: Update Home screen handler

**Files:**
- Modify: `lymoon-mobile/app/(app)/index.tsx`

### Step-by-step

- [ ] **Step 1: Add `router` import**

Add at the top of `app/(app)/index.tsx` (currently no `expo-router` import exists):

```tsx
import { router } from 'expo-router';
```

- [ ] **Step 2: Replace `handleAddSchedule` with a typed handler**

```tsx
// Before
function handleAddSchedule() {
  setSchedules((prev) => [
    ...prev,
    { ...ENGINEERING_SPRINT_TEMPLATE, id: String(Date.now()) },
  ]);
  showToast('Schedule created successfully');
}
```

```tsx
// After
function handleScheduleOption(type: 'create' | 'join') {
  if (type === 'join') {
    router.push('/join-schedule');
  } else {
    setSchedules((prev) => [
      ...prev,
      { ...ENGINEERING_SPRINT_TEMPLATE, id: String(Date.now()) },
    ]);
    showToast('Schedule created successfully');
  }
}
```

- [ ] **Step 3: Update the `NewScheduleBottomSheet` prop**

```tsx
// Before
onSelect={handleAddSchedule}

// After
onSelect={handleScheduleOption}
```

- [ ] **Step 4: Verify TypeScript compiles with zero errors**

```bash
cd lymoon-mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit Tasks 3 and 4 together**

```bash
cd lymoon-mobile && git add src/components/NewScheduleBottomSheet.tsx app/(app)/index.tsx
git commit -m "feat(join-schedule): wire Join with Code option to join-schedule route"
```

---

## Task 5: Visual verification

- [ ] **Step 1: Start Expo dev server**

```bash
cd lymoon-mobile && npx expo start
```

- [ ] **Step 2: Verify Join Schedule flow**

Tap the "New" button → bottom sheet opens → tap "Join with Code". Verify all of:

1. Full-screen "Join Schedule" page opens (no tab bar visible)
2. Keyboard appears automatically (autoFocus)
3. Typing alphanumeric characters fills cells left to right
4. Active cell shows green border + glow
5. Letters auto-convert to uppercase (type lowercase, see uppercase)
6. Non-alphanumeric characters are silently rejected
7. Paste a 6-char alphanumeric string — all 6 cells fill instantly
8. Backspace removes the last character
9. Search button has `opacity: 0.4` and is non-tappable until 6 chars entered
10. With 6 chars: Search button becomes fully opaque and tappable
11. Tapping Search logs `Join schedule with code: XXXXXX` to the console
12. Cancel button and ← both dismiss the screen

- [ ] **Step 3: Verify "Create New Schedule" is unaffected**

Tap "New" → "Create New Schedule" — a new schedule card should appear and a toast should show. The existing behavior must be unchanged.
