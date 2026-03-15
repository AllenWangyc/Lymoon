import { View, Text } from 'react-native';
import type { DayBar } from '../../../types/schedule';

export function WeekBar({ days }: { days: DayBar[] }) {
  return (
    <View className="flex-row gap-2 h-[51px]">
      {days.map((d, i) => (
        <View key={i} className="flex-1 items-center gap-1">
          <Text
            className="text-[10px] font-medium"
            style={{ color: d.isToday ? '#b6ec13' : '#94a3b8' }}
          >
            {d.day}
          </Text>
          <View
            className="flex-1 w-full rounded-[2px]"
            style={{
              backgroundColor: d.opacity === 0 ? '#f1f5f9' : '#b6ec13',
              opacity: d.opacity === 0 ? 1 : d.opacity,
            }}
          />
        </View>
      ))}
    </View>
  );
}
