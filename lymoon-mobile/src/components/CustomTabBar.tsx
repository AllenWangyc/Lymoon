import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScheduleStore } from '@/stores/scheduleStore';

type TabConfig = {
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
};

const LEFT_TABS: TabConfig[] = [
  { name: 'index', icon: 'home-outline', iconActive: 'home', label: 'Home' },
  { name: 'calendar', icon: 'calendar-outline', iconActive: 'calendar', label: 'Calendar' },
];

const RIGHT_TABS: TabConfig[] = [
  { name: 'team', icon: 'people-outline', iconActive: 'people', label: 'Teams' },
  { name: 'settings', icon: 'settings-outline', iconActive: 'settings', label: 'Settings' },
];

export function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const setShowNewScheduleSheet = useScheduleStore((s) => s.setShowNewScheduleSheet);

  function handleFabPress() {
    navigation.navigate('index');
    setShowNewScheduleSheet(true);
  }

  const isActive = (name: string) => state.routes[state.index]?.name === name;

  const renderTab = (tab: TabConfig) => {
    const active = isActive(tab.name);
    const color = active ? '#b6ec13' : '#94a3b8';
    return (
      <TouchableOpacity
        key={tab.name}
        onPress={() => navigation.navigate(tab.name)}
        activeOpacity={0.7}
        className="items-center gap-1"
      >
        <Ionicons name={active ? tab.iconActive : tab.icon} size={22} color={color} />
        <Text style={{ fontSize: 10, fontWeight: active ? '700' : '500', color }}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      className="flex-row items-center justify-between border-t border-[#f1f5f9] px-6"
      style={{
        paddingTop: 13,
        paddingBottom: Math.max(insets.bottom, 12),
        backgroundColor: 'rgba(255,255,255,0.9)',
      }}
    >
      {LEFT_TABS.map(renderTab)}

      {/* Center FAB */}
      <View className="w-14 h-4 items-center">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleFabPress}
          className="absolute -top-10 w-14 h-14 rounded-full bg-[#b6ec13] items-center justify-center"
          style={{
            shadowColor: '#b6ec13',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={28} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {RIGHT_TABS.map(renderTab)}
    </View>
  );
}
