import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeHeader } from '../../src/components/HomeHeader';
import { ScheduleCard } from '../../src/features/schedule/components/ScheduleCard';
import { MOCK_SCHEDULES, SCHEDULE_CATEGORIES } from '../../src/features/schedule/constants';

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('All');
  const insets = useSafeAreaInsets();

  // Header height: status bar + 8pt padding + greeting block (~56px) + 16pt bottom padding
  const headerHeight = insets.top + 8 + 56 + 16;

  return (
    <View className="flex-1 bg-[#f8f8f6]">
      <HomeHeader userName="Alex Rivera" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight }}
      >
        {/* Search */}
        <View className="px-6 pb-4">
          <View className="bg-white rounded-[12px] flex-row items-center px-3 py-[13px] shadow-sm border border-[#f1f5f9]">
            <Ionicons name="search-outline" size={18} color="#6b7280" style={{ marginRight: 10 }} />
            <Text className="text-[14px] text-[#6b7280]">Search schedules...</Text>
          </View>
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pb-6"
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {SCHEDULE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              className={`px-5 rounded-full ${cat === activeCategory ? 'bg-[#b6ec13]' : 'bg-white border border-[#f1f5f9]'}`}
              style={{ paddingVertical: 9 }}
            >
              <Text
                className={`text-[14px] text-center ${cat === activeCategory ? 'font-semibold text-[#0f172a]' : 'font-medium text-[#64748b]'}`}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Schedule list */}
        <View className="px-6 gap-4 pb-8">
          <View className="flex-row items-center justify-between">
            <Text className="text-[16px] font-bold text-[#0f172a]">Active Schedules</Text>
            <TouchableOpacity className="flex-row items-center gap-1">
              <Ionicons name="add-circle-outline" size={15} color="#b6ec13" />
              <Text className="text-[14px] font-semibold text-[#b6ec13]">New</Text>
            </TouchableOpacity>
          </View>
          {MOCK_SCHEDULES.map((s) => (
            <ScheduleCard key={s.id} {...s} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
