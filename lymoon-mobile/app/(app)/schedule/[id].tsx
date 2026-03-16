import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addWeeks, getDay } from 'date-fns';
import { WeekNavigator } from '../../../src/features/schedule/components/WeekNavigator';
import { DaySelector } from '../../../src/features/schedule/components/DaySelector';
import { EmployeeShiftRow } from '../../../src/features/schedule/components/EmployeeShiftRow';
import {
  MOCK_SCHEDULE_DETAIL,
  MOCK_USER_ROLE,
  MOCK_CURRENT_USER_ID,
} from '../../../src/features/schedule/constants';

function toWeekIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // TODO: replace with useScheduleDetail(id) TanStack Query hook when API is ready
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

  const headerContentHeight = 40 + 16 + 38 + 16 + 44 + 8;
  const headerHeight = insets.top + 16 + headerContentHeight;

  return (
    <View className="flex-1 bg-[#f8f8f6]">
      {/* Sticky Header */}
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
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="size-10 rounded-full bg-white items-center justify-center border border-[#f1f5f9]"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
          >
            <Ionicons name="chevron-back" size={16} color="#0f172a" />
          </TouchableOpacity>

          <View className="items-center">
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', lineHeight: 28 }}>
              {schedule.title}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748b', lineHeight: 16 }}>
              {schedule.subtitle}
            </Text>
          </View>

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

      {/* Scrollable employee list */}
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
