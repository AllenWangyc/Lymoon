import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { DayBar } from '@/types/schedule';
import { WeekBar } from './WeekBar';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

type CategoryStyle = { bg: string; text: string; label: string };

const CATEGORY_STYLES: Record<'shift' | 'event' | 'personal', CategoryStyle> = {
  shift:    { bg: 'rgba(182,236,19,0.15)', text: '#5a8a00', label: 'Shift' },
  event:    { bg: '#fef3c7', text: '#b45309', label: 'Event' },
  personal: { bg: '#ede9fe', text: '#6d28d9', label: 'Personal' },
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = { bg: '#f1f5f9', text: '#64748b', label: 'Schedule' };

function formatHours(hours: string): string {
  const num = parseFloat(hours);
  if (isNaN(num) || num === 0) return '0h';
  const h = Math.floor(num);
  const m = Math.round((num - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  scheduleType?: 'shift' | 'event' | 'personal';
  hours: string;
  days: DayBar[];
  iconBg: string;
};

export function ScheduleCard({ id, title, subtitle, description, scheduleType, hours, days, iconBg }: Props) {
  const fullWeek = DAY_LABELS.map((day, i) => days[i] ?? { day, opacity: 0 });
  const catStyle = scheduleType ? CATEGORY_STYLES[scheduleType] : DEFAULT_CATEGORY_STYLE;
  const displaySubtitle = description?.trim() || subtitle;

  return (
    <View className="bg-white border border-[#f1f5f9] rounded-[12px] p-[21px] gap-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-3 flex-1 mr-2">
          <View
            className="w-12 h-12 rounded-[8px] items-center justify-center"
            style={{ backgroundColor: iconBg }}
          >
            <Ionicons name="calendar-outline" size={22} color="#b6ec13" />
          </View>
          <View className="gap-0.5 flex-1">
            <Text className="text-[15px] font-semibold text-[#0f172a]" numberOfLines={1}>{title}</Text>
            {displaySubtitle && (
              <Text className="text-[12px] text-[#64748b]" numberOfLines={1}>{displaySubtitle}</Text>
            )}
          </View>
        </View>
        <View
          className="px-2 py-1 rounded-[4px]"
          style={{ backgroundColor: catStyle.bg }}
        >
          <Text
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: catStyle.text }}
          >
            {catStyle.label}
          </Text>
        </View>
      </View>

      <WeekBar days={fullWeek} />

      <View className="border-t border-[#f8fafc] pt-4 flex-row items-center justify-between">
        <View className="gap-0.5">
          <Text className="text-[12px] font-medium text-[#94a3b8]">Total Weekly Hours</Text>
          <Text className="text-[14px] font-bold text-[#0f172a] mt-1">{formatHours(hours)}</Text>
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
