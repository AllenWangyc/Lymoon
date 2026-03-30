# Schedule Detail Screen Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `app/(app)/schedule/[id].tsx` — the schedule detail screen reached by tapping "View Details" on a ScheduleCard, showing a weekly shift grid per employee with role-based permissions.

**Architecture:** A new Expo Router Stack route renders a sticky header (title + week navigator + day selector) over a scrollable per-employee shift list. State is local (selected day, week offset) backed by mock data. Role-based visibility (Manager vs Member) is driven by a mock `currentUserId` constant until auth is wired up. All new sub-components live in `src/features/schedule/components/`.

**Tech Stack:** Expo Router v3, React Native, NativeWind v4, TypeScript, Ionicons, `date-fns`

---

## Chunk 1: Types, Mock Data, Route Scaffold

### Task 1: Extend TypeScript types

**Files:**
- Modify: `src/types/schedule.ts`

- [ ] **Step 1: Add new types to the bottom of the file**

```typescript
// Existing types stay untouched above this line

export type ShiftType = 'Morning' | 'Standard' | 'Afternoon' | 'Custom';

export type Shift = {
  id: string;
  employeeId: string;
  dayOfWeek: number; // 0 = Mon … 6 = Sun
  startTime: string; // "09:00"
  endTime: string;   // "13:00"
  shiftType: ShiftType;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  avatarInitials: string; // e.g. "AR" for Alex Rivera
};

export type ScheduleDetail = ScheduleItem & {
  employees: Employee[];
  shifts: Shift[];
  weekStartDate: string; // ISO date string "2024-10-14" (always a Monday)
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd Lymoon-mobile && npx tsc --noEmit
```
Expected: no errors related to `schedule.ts`.

---

### Task 2: Add mock detail data

**Files:**
- Modify: `src/features/schedule/constants.ts`

Purpose: provide realistic mock data the detail screen can consume without an API.

- [ ] **Step 1: Add mock constants to the bottom of the file**

```typescript
// ── Mock users (simulates what auth would provide) ──────────────────────────
export const MOCK_CURRENT_USER_ID = 'emp-1'; // Change to 'emp-2' to test Member view
export const MOCK_USER_ROLE: 'Manager' | 'Member' = 'Manager'; // or 'Member'

// ── Mock employees ───────────────────────────────────────────────────────────
export const MOCK_EMPLOYEES: import('../../types/schedule').Employee[] = [
  { id: 'emp-1', name: 'Alex Rivera', role: 'Lead Developer', avatarInitials: 'AR' },
  { id: 'emp-2', name: 'Sarah Chen',  role: 'UI Designer',    avatarInitials: 'SC' },
];

// ── Mock shifts for week of Oct 14 (Wed = day index 2 shown in Figma) ────────
export const MOCK_SHIFTS: import('../../types/schedule').Shift[] = [
  { id: 'shift-1', employeeId: 'emp-1', dayOfWeek: 2, startTime: '09:00', endTime: '13:00', shiftType: 'Morning' },
  { id: 'shift-2', employeeId: 'emp-2', dayOfWeek: 2, startTime: '10:00', endTime: '18:00', shiftType: 'Standard' },
  { id: 'shift-3', employeeId: 'emp-2', dayOfWeek: 2, startTime: '14:00', endTime: '18:00', shiftType: 'Afternoon' },
];

// ── Full detail object for the engineering sprint schedule ───────────────────
export const MOCK_SCHEDULE_DETAIL: import('../../types/schedule').ScheduleDetail = {
  ...ENGINEERING_SPRINT_TEMPLATE,
  id: 'schedule-1',
  employees: MOCK_EMPLOYEES,
  shifts: MOCK_SHIFTS,
  weekStartDate: '2024-10-14',
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

---

### Task 3: Create the schedule stack layout

**Files:**
- Create: `app/(app)/schedule/_layout.tsx`

Pattern: mirrors `app/(app)/team/_layout.tsx` exactly.

- [ ] **Step 1: Create the file**

```typescript
import { Stack } from 'expo-router';

export default function ScheduleLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Commit**

```bash
git add src/types/schedule.ts src/features/schedule/constants.ts app/(app)/schedule/_layout.tsx
git commit -m "feat(schedule-detail): add types, mock data, and route layout"
```

---

## Chunk 2: Reusable Components

### Task 4: WeekNavigator component

**Files:**
- Create: `src/features/schedule/components/WeekNavigator.tsx`

Renders the `< Oct 16 – Oct 22 >` pill and the `+ Next Week` pill. `+ Next Week` is only visible to Managers. The `< >` arrows fire `onPrevWeek` / `onNextWeek` callbacks.

- [ ] **Step 1: Create the component**

```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays } from 'date-fns';

type Props = {
  weekStartDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onAddNextWeek: () => void;
  isManager: boolean;
};

export function WeekNavigator({
  weekStartDate,
  onPrevWeek,
  onNextWeek,
  onAddNextWeek,
  isManager,
}: Props) {
  const weekEndDate = addDays(weekStartDate, 6);
  const label = `${format(weekStartDate, 'MMM d')} – ${format(weekEndDate, 'MMM d')}`;

  return (
    <View className="flex-row items-center gap-4">
      {/* Week range pill */}
      <View
        className="flex-row items-center gap-3 bg-white border border-[#f1f5f9] rounded-full px-4 py-[9px]"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
      >
        <TouchableOpacity onPress={onPrevWeek} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={14} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{label}</Text>
        <TouchableOpacity onPress={onNextWeek} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-forward" size={14} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* + Next Week pill — Manager only */}
      {isManager && (
        <TouchableOpacity
          onPress={onAddNextWeek}
          activeOpacity={0.75}
          className="rounded-full px-4 py-[9px]"
          style={{
            backgroundColor: 'rgba(182,236,19,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(182,236,19,0.2)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          {/* font size 13 to fill the pill button comfortably */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>+ Next Week</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

---

### Task 5: DaySelector component

**Files:**
- Create: `src/features/schedule/components/DaySelector.tsx`

Renders a row of 7 day columns (Mon–Sun). The selected day gets a `#b6ec13` circle background.

- [ ] **Step 1: Create the component**

```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import { format, addDays } from 'date-fns';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type Props = {
  weekStartDate: Date;
  selectedDayIndex: number; // 0 = Mon … 6 = Sun
  onSelectDay: (index: number) => void;
};

export function DaySelector({ weekStartDate, selectedDayIndex, onSelectDay }: Props) {
  return (
    <View className="flex-row items-center justify-between w-full pb-2">
      {DAY_LABELS.map((label, i) => {
        const date = addDays(weekStartDate, i);
        const dayNumber = format(date, 'd');
        const isSelected = i === selectedDayIndex;

        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelectDay(i)}
            activeOpacity={0.7}
            className="items-center min-w-[48px]"
          >
            {/* Day label */}
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: isSelected ? '#0f172a' : '#94a3b8',
                paddingBottom: 4,
              }}
            >
              {label}
            </Text>

            {/* Date number — highlighted pill if selected */}
            <View
              className={isSelected ? 'rounded-full py-1 px-3' : ''}
              style={isSelected ? { backgroundColor: '#b6ec13' } : undefined}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isSelected ? '700' : '600',
                  color: '#0f172a',
                  lineHeight: 20,
                }}
              >
                {dayNumber}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
```

---

### Task 6: ShiftCard component

**Files:**
- Create: `src/features/schedule/components/ShiftCard.tsx`

Renders a single assigned shift — label (e.g. "MORNING") and time range ("09:00 – 13:00"). Lime-green tinted background.

- [ ] **Step 1: Create the component**

```typescript
import { View, Text } from 'react-native';
import type { Shift } from '../../../types/schedule';

type Props = {
  shift: Shift;
};

export function ShiftCard({ shift }: Props) {
  return (
    <View
      className="rounded-[12px] px-[17px] py-[13px] min-w-[120px] self-stretch"
      style={{
        backgroundColor: 'rgba(182,236,19,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(182,236,19,0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: '#64748b',
          letterSpacing: -0.25,
          textTransform: 'uppercase',
          lineHeight: 15,
        }}
      >
        {shift.shiftType}
      </Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', lineHeight: 20 }}>
        {shift.startTime} – {shift.endTime}
      </Text>
    </View>
  );
}
```

---

### Task 7: AddShiftSlot component

**Files:**
- Create: `src/features/schedule/components/AddShiftSlot.tsx`

A tappable dashed-border placeholder card. Visibility is controlled by the parent — parent already handles Manager/Member logic before rendering this.

- [ ] **Step 1: Create the component**

```typescript
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  onPress: () => void;
};

export function AddShiftSlot({ onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      className="min-w-[120px] self-stretch items-center justify-center rounded-[12px]"
      style={{
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed',
        paddingHorizontal: 51,
        paddingVertical: 13,
      }}
    >
      <Ionicons name="add" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );
}
```

---

### Task 8: EmployeeShiftRow component

**Files:**
- Create: `src/features/schedule/components/EmployeeShiftRow.tsx`

Renders one employee's avatar + name/role header, then a horizontal `ScrollView` of their shifts for the selected day, plus an `AddShiftSlot` when:
- The current user is a **Manager** (can add to any employee), OR
- The current user is a **Member** and this row belongs to them (`employee.id === currentUserId`).

- [ ] **Step 1: Create the component**

```typescript
import { View, Text, ScrollView } from 'react-native';
import type { Employee, Shift } from '../../../types/schedule';
import { ShiftCard } from './ShiftCard';
import { AddShiftSlot } from './AddShiftSlot';

type Props = {
  employee: Employee;
  shifts: Shift[];       // already filtered to the selected day for this employee
  isManager: boolean;
  currentUserId: string;
  onAddShift: (employeeId: string) => void;
};

export function EmployeeShiftRow({
  employee,
  shifts,
  isManager,
  currentUserId,
  onAddShift,
}: Props) {
  const canAddShift = isManager || employee.id === currentUserId;

  return (
    <View className="gap-3">
      {/* Employee header */}
      <View className="flex-row items-center gap-3">
        {/* Avatar circle with initials */}
        <View
          className="size-9 rounded-full items-center justify-center"
          style={{
            backgroundColor: '#e2e8f0',
            borderWidth: 2,
            borderColor: '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
            {employee.avatarInitials}
          </Text>
        </View>

        <View className="gap-[2px]">
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', lineHeight: 20 }}>
            {employee.name}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '500', color: '#94a3b8', lineHeight: 15 }}>
            {employee.role}
          </Text>
        </View>
      </View>

      {/* Horizontal shift cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        style={{ height: 65 }}
      >
        {shifts.map((shift) => (
          <ShiftCard key={shift.id} shift={shift} />
        ))}
        {canAddShift && (
          <AddShiftSlot onPress={() => onAddShift(employee.id)} />
        )}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Commit**

```bash
git add src/features/schedule/components/WeekNavigator.tsx \
        src/features/schedule/components/DaySelector.tsx \
        src/features/schedule/components/ShiftCard.tsx \
        src/features/schedule/components/AddShiftSlot.tsx \
        src/features/schedule/components/EmployeeShiftRow.tsx
git commit -m "feat(schedule-detail): add WeekNavigator, DaySelector, ShiftCard, AddShiftSlot, EmployeeShiftRow components"
```

---

## Chunk 3: Screen Assembly & Navigation Wiring

### Task 9: Build the schedule detail screen

**Files:**
- Create: `app/(app)/schedule/[id].tsx`

Composes all sub-components. Manages two pieces of local state:
- `selectedDayIndex` (0–6, defaulting to today's day-of-week clamped to the week)
- `weekOffset` (integer offset from the schedule's `weekStartDate`, allows `< >` navigation)

- [ ] **Step 1: Create the screen**

```typescript
import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addDays, addWeeks, getDay } from 'date-fns';
import { WeekNavigator } from '../../../src/features/schedule/components/WeekNavigator';
import { DaySelector } from '../../../src/features/schedule/components/DaySelector';
import { EmployeeShiftRow } from '../../../src/features/schedule/components/EmployeeShiftRow';
import {
  MOCK_SCHEDULE_DETAIL,
  MOCK_USER_ROLE,
  MOCK_CURRENT_USER_ID,
} from '../../../src/features/schedule/constants';

// date-fns getDay: 0=Sun…6=Sat; we use 0=Mon…6=Sun internally
function toWeekIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // In a real app: const { data: schedule } = useScheduleDetail(id)
  // For now: use mock data regardless of id
  const schedule = MOCK_SCHEDULE_DETAIL;

  const baseWeekStart = useMemo(
    () => new Date(schedule.weekStartDate),
    [schedule.weekStartDate],
  );

  const today = new Date();
  const todayIndex = toWeekIndex(getDay(today));

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

  const currentWeekStart = useMemo(
    () => addWeeks(baseWeekStart, weekOffset),
    [baseWeekStart, weekOffset],
  );

  const isManager = MOCK_USER_ROLE === 'Manager';

  // Shifts for current day only
  const shiftsForDay = useMemo(
    () => schedule.shifts.filter((s) => s.dayOfWeek === selectedDayIndex),
    [schedule.shifts, selectedDayIndex],
  );

  function getEmployeeShifts(employeeId: string) {
    return shiftsForDay.filter((s) => s.employeeId === employeeId);
  }

  function handleAddShift(employeeId: string) {
    // TODO: open add-shift bottom sheet
    console.log('Add shift for', employeeId);
  }

  // Header height: safe area + 40px title row + 16px gap + 38px week nav + 16px gap + 44px day selector + 8px bottom padding
  const headerContentHeight = 40 + 16 + 38 + 16 + 44 + 8;
  const headerHeight = insets.top + 16 + headerContentHeight; // 16 = pt-4

  return (
    <View className="flex-1 bg-[#f8f8f6]">
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <View
        className="absolute top-0 left-0 right-0 z-10 px-6 gap-4"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 8,
          backgroundColor: 'rgba(248,248,246,0.95)',
        }}
      >
        {/* Title row */}
        <View className="flex-row items-center justify-between">
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="size-10 rounded-full bg-white items-center justify-center border border-[#f1f5f9]"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
          >
            <Ionicons name="chevron-back" size={16} color="#0f172a" />
          </TouchableOpacity>

          {/* Title + subtitle */}
          <View className="items-center">
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', lineHeight: 28 }}>
              {schedule.title}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748b', lineHeight: 16 }}>
              {schedule.subtitle}
            </Text>
          </View>

          {/* More options button */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="size-10 rounded-full bg-white items-center justify-center border border-[#f1f5f9]"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Week navigator */}
        <WeekNavigator
          weekStartDate={currentWeekStart}
          onPrevWeek={() => setWeekOffset((o) => o - 1)}
          onNextWeek={() => setWeekOffset((o) => o + 1)}
          onAddNextWeek={() => setWeekOffset((o) => o + 1)}
          isManager={isManager}
        />

        {/* Day selector */}
        <DaySelector
          weekStartDate={currentWeekStart}
          selectedDayIndex={selectedDayIndex}
          onSelectDay={setSelectedDayIndex}
        />
      </View>

      {/* ── Scrollable employee list ───────────────────────────────────────── */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingHorizontal: 16,
          paddingBottom: 96,
          gap: 24,
        }}
      >
        {schedule.employees.map((employee) => (
          <EmployeeShiftRow
            key={employee.id}
            employee={employee}
            shifts={getEmployeeShifts(employee.id)}
            isManager={isManager}
            currentUserId={MOCK_CURRENT_USER_ID}
            onAddShift={handleAddShift}
          />
        ))}
      </ScrollView>
    </View>
  );
}
```

---

### Task 10: Wire navigation in ScheduleCard + HomeScreen

**Files:**
- Modify: `src/features/schedule/components/ScheduleCard.tsx`
- Modify: `app/(app)/index.tsx`

The card needs the schedule `id` to navigate. Currently `ScheduleCard` doesn't receive it.

- [ ] **Step 1: Add `id` and `onViewDetails` to ScheduleCard props**

In `ScheduleCard.tsx`, update the `Props` type and the "View Details" button:

```typescript
// Change Props type: add id
type Props = {
  id: string;           // ← add this
  title: string;
  subtitle: string;
  status: string;
  isActive: boolean;
  hours: string;
  days: DayBar[];
  iconBg: string;
};

// Change the component signature to include id
export function ScheduleCard({ id, title, subtitle, status, isActive, hours, days, iconBg }: Props) {
```

- [ ] **Step 2: Add the navigation import and wire up the button**

At the top of `ScheduleCard.tsx` add:
```typescript
import { router } from 'expo-router';
```

Replace the existing `TouchableOpacity` "View Details" button:
```typescript
<TouchableOpacity
  className="bg-[#b6ec13] rounded-[8px] px-4 py-2"
  onPress={() => router.push(`/schedule/${id}`)}
>
  <Text className="text-[12px] font-bold text-[#0f172a]">View Details</Text>
</TouchableOpacity>
```

- [ ] **Step 3: Pass `id` from the home screen**

In `app/(app)/index.tsx`, the `ScheduleCard` is rendered as:
```tsx
schedules.map((s) => (
  <ScheduleCard key={s.id} {...s} />
))
```
Since `ScheduleItem` already has `id: string`, spreading `{...s}` already passes `id`. No further change needed.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Commit**

```bash
git add app/(app)/schedule/[id].tsx \
        src/features/schedule/components/ScheduleCard.tsx
git commit -m "feat(schedule-detail): wire schedule detail screen and ScheduleCard navigation"
```

---

## Smoke-Test Checklist

After all tasks, manually verify on the simulator:

- [ ] Home screen shows a schedule card after tapping the FAB → New → "Create New Schedule"
- [ ] Tapping "View Details" navigates to `/schedule/<id>` without crash
- [ ] Back button returns to home
- [ ] Header title shows schedule name and subtitle
- [ ] Day selector highlights correct day; tapping any day updates the shift list
- [ ] `< >` arrows in WeekNavigator change the displayed week dates
- [ ] **Manager view**: `+ Next Week` pill is visible; shift rows show AddShiftSlot for all employees
- [ ] **Member view** (set `MOCK_USER_ROLE = 'Member'` and `MOCK_CURRENT_USER_ID = 'emp-2'`):
  - `+ Next Week` pill is hidden
  - Only Sarah Chen's row shows AddShiftSlot; Alex Rivera's row does not
- [ ] Shifts render correctly for the selected day (Wed: Alex has Morning, Sarah has Standard + Afternoon)
- [ ] Switching to a day with no shifts shows only AddShiftSlot(s) or empty row

---

## Notes

> **"左下角的Add按钮文本尺寸"** is interpreted as the `+ Next Week` pill button in `WeekNavigator`. The Figma reference used `text-[11px]` which is undersized for its pill container. This plan uses `fontSize: 13` to better fill the button. If you were referring to a different button, let me know.
