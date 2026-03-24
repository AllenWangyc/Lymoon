import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeHeader } from '@/components/HomeHeader';
import { ScheduleCard } from '@/features/schedule/components/ScheduleCard';
import { NewScheduleBottomSheet } from '@/components/NewScheduleBottomSheet';
import { SCHEDULE_CATEGORIES } from '@/features/schedule/constants';
import { useToast } from '@/hooks/useToast';
import { useScheduleStore } from '@/stores/scheduleStore';
import type { ScheduleCategory } from '@/types/schedule';

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState<ScheduleCategory>('All');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { schedules, pendingToast, clearPendingToast, showNewScheduleSheet, setShowNewScheduleSheet } = useScheduleStore();

  useEffect(() => {
    if (pendingToast) {
      showToast(pendingToast);
      clearPendingToast();
    }
  }, [pendingToast]);

  useEffect(() => {
    if (showNewScheduleSheet) {
      setSheetVisible(true);
      setShowNewScheduleSheet(false);
    }
  }, [showNewScheduleSheet]);

  function handleScheduleOption(type: 'join') {
    if (type === 'join') {
      router.push('/join-schedule');
    }
    // 'create' is handled directly in NewScheduleBottomSheet via router.push('/create-schedule')
  }

  const filteredSchedules = schedules
    .filter((s) => activeCategory === 'All' || s.scheduleType?.toLowerCase() === activeCategory.toLowerCase())
    .filter((s) => !searchQuery.trim() || s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Header height: status bar + 8pt padding + greeting block (~56px) + 16pt bottom padding
  const headerHeight = insets.top + 8 + 56 + 16;

  return (
    <View className="flex-1 bg-[#f8f8f6]">
      <HomeHeader />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight }}
      >
        {/* Search */}
        <View className="px-6 pb-4">
          <View className={`bg-white rounded-[12px] flex-row items-center px-3 py-[13px] border ${searchFocused ? 'border-[#b6ec13]' : 'border-[#f1f5f9]'}`}>
            <Ionicons name="search-outline" size={18} color={searchFocused ? '#4a6b00' : '#6b7280'} style={{ marginRight: 10 }} />
            <TextInput
              className="flex-1 text-[14px] text-[#0f172a]"
              placeholder="Search schedules..."
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
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
              className={`px-5 py-[9px] rounded-full ${cat === activeCategory ? 'bg-[#b6ec13]' : 'bg-white border border-[#f1f5f9]'}`}
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
            <TouchableOpacity className="flex-row items-center gap-1" onPress={() => setSheetVisible(true)}>
              <Ionicons name="add-circle-outline" size={15} color="#b6ec13" />
              <Text className="text-[14px] font-semibold text-[#b6ec13]">New</Text>
            </TouchableOpacity>
          </View>
          {filteredSchedules.length === 0 ? (
            <View className="items-center justify-center px-6 py-16">
              <View className="mb-6 items-center justify-center rounded-[24px] bg-[rgba(241,245,249,0.7)] size-16"
                style={{ shadowColor: '#e2e8f0', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.5, shadowRadius: 2, elevation: 1 }}
              >
                <Ionicons name="calendar-outline" size={28} color="#94a3b8" />
              </View>
              <Text className="text-[16px] font-bold text-center text-[rgba(15,23,42,0.7)] mb-1">
                {searchQuery.trim() ? 'No matching schedules' : 'No active schedules yet'}
              </Text>
              <Text className="text-[14px] text-[#64748b] text-center max-w-[200px]" style={{ lineHeight: 20 }}>
                {searchQuery.trim() ? 'Try a different search term.' : 'Tap + to create or join a schedule to get started.'}
              </Text>
            </View>
          ) : (
            filteredSchedules.map((s) => (
              <ScheduleCard key={s.id} {...s} />
            ))
          )}
        </View>
      </ScrollView>

      <NewScheduleBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSelect={handleScheduleOption}
      />
    </View>
  );
}
