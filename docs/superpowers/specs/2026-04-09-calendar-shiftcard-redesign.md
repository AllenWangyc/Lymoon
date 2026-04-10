# Calendar ShiftCard Redesign

**Date:** 2026-04-09  
**File:** `lymoon-mobile/src/features/calendar/components/ShiftCard.tsx`

## Goal

Remove the `shiftType` badge from the calendar ShiftCard and redesign the layout so it remains visually balanced.

## Current Layout

```
[ dot ]  scheduleTitle       [ shiftType badge ]
         startTime → endTime
```

- Left: 10px colored circle (`scheduleIconBg`)
- Middle: title + time range
- Right: shiftType pill (e.g. "Morning", "Standard")

## New Layout

```
[bar]  scheduleTitle         8h 30m
       startTime → endTime
```

- Left: 4px full-height accent bar (`scheduleIconBg`, left corners rounded)
- Middle: title + time range (unchanged)
- Right: shift duration text (e.g. "8h 30m")

## Component Structure

```
TouchableOpacity (flex-row, overflow:hidden, rounded-xl, bg-white, shadow)
├── AccentBar
│     width: 4
│     alignSelf: 'stretch'
│     backgroundColor: shift.scheduleIconBg
│     borderTopLeftRadius: 12
│     borderBottomLeftRadius: 12
├── Content View (flex-1, px=14, py=12)
│     ├── Text: scheduleTitle — 14px, weight 600, #0f172a
│     └── Text: startTime → endTime — 13px, weight 400, #64748b, mt=2
└── Duration View (pr=14, justifyContent='center')
      └── Text: formatDuration(startTime, endTime) — 13px, weight 600, #64748b
```

## Key Implementation Details

1. **`overflow: 'hidden'`** on the card outer view — required for `rounded-xl` to clip the accent bar's left corners cleanly.
2. **`alignSelf: 'stretch'`** on the accent bar — fills card height automatically without a fixed `height` value.
3. **`formatDuration`** utility — computes hours/minutes from two `"HH:mm"` strings. Define inline in the component (same logic as `schedule/ShiftCard.tsx`). If reuse grows, extract to `src/utils/time.ts`.
4. **`shiftType` field** — remains in `MyShift` type definition; only the display layer changes.
5. **`SHIFT_TYPE_LABELS` map** — remove entirely (no longer referenced).

## What Does NOT Change

- `MyShift` type in `src/types/calendar.ts`
- `DayShiftSheet` component (no prop changes)
- Card press behavior and `onPress` prop
- Shadow and overall card dimensions
