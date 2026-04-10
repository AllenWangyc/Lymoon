# DayShiftSheet Fixed Height Design

**Date:** 2026-04-09
**Status:** Approved

## Problem

`DayShiftSheet` passes `height={340}` to `BottomSheet`, but that prop was only used for the slide animation range — the `Animated.View` inside `BottomSheet` had no `height` style, so the sheet sized itself to content. With a single shift, the sheet appeared too short and visually imbalanced.

## Solution

Apply `height` as a layout style on `Animated.View` inside `BottomSheet`, making the `height` prop dual-purpose: animation range (existing) and layout constraint (new). Update `DayShiftSheet` to compute its height responsively as `Math.min(420, screenHeight * 0.6)` using `useWindowDimensions`, and ensure its `ScrollView` fills remaining space with `flex: 1`.

The formula caps the sheet at 420px on large phones while scaling down proportionally on smaller screens (e.g. an SE-sized phone at 667px screen height → ~400px sheet).

## Changes

### 1. `BottomSheet.tsx`

Add `height` to the `Animated.View` style:

```tsx
<Animated.View
  style={{
    transform: [{ translateY }],
    backgroundColor,
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,
    height,          // ← new
    ...(showTopBorder && { ... }),
    ...
  }}
>
```

No new props. The existing `height` prop now controls both animation and layout.

### 2. `DayShiftSheet.tsx`

- Compute responsive height with `useWindowDimensions`: `Math.min(420, screenHeight * 0.6)`
- Pass computed height to `BottomSheet` (replaces hardcoded `340`)
- Add `style={{ flex: 1 }}` to `ScrollView` so it expands to fill bounded space below the date header

```tsx
const { height: screenHeight } = useWindowDimensions();
const sheetHeight = Math.min(420, screenHeight * 0.6);

<BottomSheet visible={visible} onClose={onClose} height={sheetHeight}>
  <View className="px-5 pt-1 pb-6" style={{ flex: 1 }}>
    <Text style={{ fontSize: 17, fontWeight: '700', ... }}>
      {formattedDate}
    </Text>
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      {shifts.map(...)}
    </ScrollView>
  </View>
</BottomSheet>
```

## Impact on Other Sheets

All 6 other `BottomSheet` consumers have height values already matched to their fixed content:

| Sheet | Height | Content type |
|---|---|---|
| RenameScheduleSheet | 280 | Fixed form |
| ConfirmActionSheet | 320 | Fixed confirmation UI |
| NewScheduleBottomSheet | 320 | Fixed options list |
| ShiftDetailBottomSheet | 420 | Fixed detail layout |
| ViewMembersSheet | 480 | Member list |
| AddEditShiftBottomSheet | 560 | Fixed form |
| WeekPickerBottomSheet | 600 | Fixed calendar picker |

No changes required to any of these.

## Success Criteria

- Sheet height = `min(420, screenHeight × 0.6)` — adapts to screen size, no magic number
- Single-shift view shows card at the top with empty space below (no clipping)
- Multiple-shift view scrolls when content exceeds available height
- All other bottom sheets display identically to before
