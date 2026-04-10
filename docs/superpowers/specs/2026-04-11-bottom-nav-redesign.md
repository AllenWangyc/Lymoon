# Bottom Navigation Bar Redesign

**Date:** 2026-04-11
**Status:** Approved

---

## Context

The current bottom navigation bar has 4 regular tabs (Home, Calendar, Team, Settings) plus a center FAB. For MVP, the Team tab is not needed. Removing it leaves 3 tabs, which creates an imbalance with the center FAB layout. This spec redesigns the nav bar to suit the slimmed-down MVP scope.

---

## Design Decision

**Layout:** 3 tabs (Home, Calendar, Settings) evenly distributed across the nav bar. FAB moves to the **bottom-right corner** as a floating button overlapping the nav bar.

**FAB visibility:** FAB is **only shown on the Home tab**. On Calendar and Settings, it is hidden.

**FAB animation:** Scale spring animation (`Animated.spring`, tension: 200, friction: 12). Entering Home → scale 0→1. Leaving Home → scale 1→0.

---

## Implementation Details

### Files to change

- `lymoon-mobile/src/components/CustomTabBar.tsx` — primary change
- `lymoon-mobile/app/(app)/_layout.tsx` — remove `team` tab screen

### CustomTabBar changes

1. **Remove `LEFT_TABS` / `RIGHT_TABS` split.** Replace with a single `TABS` array:
   ```ts
   const TABS: TabConfig[] = [
     { name: 'index',    icon: 'home-outline',     iconActive: 'home',     label: 'Home' },
     { name: 'calendar', icon: 'calendar-outline',  iconActive: 'calendar', label: 'Calendar' },
     { name: 'settings', icon: 'settings-outline',  iconActive: 'settings', label: 'Settings' },
   ];
   ```

2. **Render tabs with `justify-content: space-evenly`** — no center gap slot needed.

3. **FAB as absolute-positioned overlay** in the bottom-right corner of the nav bar:
   - Position: `right: 16`, `bottom: navBarHeight + 8` (above the nav bar)
   - Size: 52×52, `borderRadius: 26`, `backgroundColor: '#b6ec13'`
   - Shadow: `shadowColor: '#b6ec13'`, `elevation: 8`

4. **FAB visibility controlled by `Animated.Value`:**
   ```ts
   const fabScale = useRef(new Animated.Value(isHome ? 1 : 0)).current;

   useEffect(() => {
     Animated.spring(fabScale, {
       toValue: isHome ? 1 : 0,
       tension: 200,
       friction: 12,
       useNativeDriver: true,
     }).start();
   }, [isHome]);
   ```
   Wrap FAB in `<Animated.View style={{ transform: [{ scale: fabScale }] }}>`.

5. **FAB press behavior** unchanged: navigate to `index` and call `setShowNewScheduleSheet(true)`.

6. **Remove `team` from hidden-route guard** — it's no longer a tab.

### _layout.tsx changes

Remove the `<Tabs.Screen name="team" />` line. The `team` route (if it still exists as a screen) should be accessed via navigation push, not as a bottom tab.

---

## Behaviour Summary

| Tab active | FAB visible |
|------------|-------------|
| Home       | Yes (scale 1, spring in) |
| Calendar   | No (scale 0, spring out) |
| Settings   | No (scale 0, spring out) |

---

## Verification

1. Run `npx expo start` and open in simulator.
2. Confirm nav bar shows 3 tabs evenly spaced.
3. On Home tab: FAB appears in bottom-right with spring animation.
4. Switch to Calendar: FAB springs out (scale to 0).
5. Switch back to Home: FAB springs in (scale to 1).
6. Tap FAB: navigates to Home and opens new schedule sheet.
7. Confirm no Team tab is visible anywhere in the nav bar.
