import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { DayBar } from '../../../types/schedule';
import { WeekBar } from './WeekBar';

type Props = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  isActive: boolean;
  hours: string;
  days: DayBar[];
  iconBg: string;
};

export function ScheduleCard({ id, title, subtitle, status, isActive, hours, days, iconBg }: Props) {
  return (
    <View className="bg-white border border-[#f1f5f9] rounded-[12px] p-[21px] gap-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-3">
          <View
            className="w-12 h-12 rounded-[8px] items-center justify-center"
            style={{ backgroundColor: iconBg }}
          >
            <Ionicons
              name="calendar-outline"
              size={22}
              color={isActive ? '#b6ec13' : '#64748b'}
            />
          </View>
          <View className="gap-0.5">
            <Text className="text-[16px] font-bold text-[#0f172a]">{title}</Text>
            <Text className="text-[12px] text-[#64748b]">{subtitle}</Text>
          </View>
        </View>
        <View
          className="px-2 py-1 rounded-[4px]"
          style={{ backgroundColor: isActive ? 'rgba(182,236,19,0.2)' : '#f1f5f9' }}
        >
          <Text
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: isActive ? '#b6ec13' : '#64748b' }}
          >
            {status}
          </Text>
        </View>
      </View>

      <WeekBar days={days} />

      <View className="border-t border-[#f8fafc] pt-4 flex-row items-center justify-between">
        <View className="gap-0.5">
          <Text className="text-[12px] font-medium text-[#94a3b8]">Total Weekly Hours</Text>
          <Text className="text-[18px] font-bold text-[#0f172a]">{hours}</Text>
        </View>
        <TouchableOpacity
          className="bg-[#b6ec13] rounded-[8px] px-4 py-2"
          onPress={() => router.push(`/schedule/${id}`)}
        >
          <Text className="text-[12px] font-bold text-[#0f172a]">View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
