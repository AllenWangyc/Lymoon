import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScheduleStore } from '@/stores/scheduleStore';

type TabConfig = {
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
};

const TABS: TabConfig[] = [
  { name: 'index',    icon: 'home-outline',     iconActive: 'home',     label: 'Home' },
  { name: 'calendar', icon: 'calendar-outline',  iconActive: 'calendar', label: 'Calendar' },
  { name: 'settings', icon: 'settings-outline',  iconActive: 'settings', label: 'Settings' },
];

const HIDDEN_ROUTES = new Set(['create-schedule', 'schedule-created', 'schedule', 'notifications']);

export function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const setShowNewScheduleSheet = useScheduleStore((s) => s.setShowNewScheduleSheet);

  const currentRoute = state.routes[state.index]?.name;

  const isHome = currentRoute === 'index';
  const fabScale = useRef(new Animated.Value(isHome ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(fabScale, {
      toValue: isHome ? 1 : 0,
      tension: 200,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [isHome]);

  if (HIDDEN_ROUTES.has(currentRoute)) return null;

  function handleFabPress() {
    navigation.navigate('index');
    setShowNewScheduleSheet(true);
  }

  const isActive = (name: string) => currentRoute === name;
  const bottomPadding = Math.max(insets.bottom, 12);
  const navBarHeight = 13 + 22 + 4 + 10 + bottomPadding; // pt + icon + gap + label + bottom

  const renderTab = (tab: TabConfig) => {
    const active = isActive(tab.name);
    const color = active ? '#b6ec13' : '#94a3b8';
    return (
      <TouchableOpacity
        key={tab.name}
        onPress={() => navigation.navigate(tab.name)}
        activeOpacity={0.7}
        className="flex-1 items-center gap-1"
      >
        <Ionicons name={active ? tab.iconActive : tab.icon} size={22} color={color} />
        <Text style={{ fontSize: 10, fontWeight: active ? '700' : '500', color }}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {/* Right-corner FAB — absolutely positioned above the nav bar */}
      <Animated.View
        pointerEvents={isHome ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          right: 16,
          bottom: navBarHeight + 8,
          transform: [{ scale: fabScale }],
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleFabPress}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: '#b6ec13',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#b6ec13',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={28} color="#0f172a" />
        </TouchableOpacity>
      </Animated.View>

      {/* Nav bar */}
      <View
        className="flex-row items-center border-t border-[#f1f5f9] pt-[13px]"
        style={{
          paddingBottom: bottomPadding,
          backgroundColor: 'rgba(255,255,255,0.9)',
        }}
      >
        {TABS.map(renderTab)}
      </View>
    </View>
  );
}
