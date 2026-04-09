import { Text, TouchableOpacity, View } from 'react-native';
import type { MyShift } from '@/types/calendar';

interface ShiftCardProps {
  shift: MyShift;
  onPress: () => void;
}

function toSolidColor(color: string): string {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
  return color;
}

function formatDuration(startTime: string, endTime: string): string {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  const minutes = totalMinutes < 0 ? totalMinutes + 24 * 60 : totalMinutes;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function ShiftCard({ shift, onPress }: ShiftCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-stretch bg-white rounded-xl mb-2 overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 4,
          backgroundColor: toSolidColor(shift.scheduleIconBg),
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
        }}
      />

      <View className="flex-1 pl-[18px] pr-[10px] py-[12px]">
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>
          {shift.scheduleTitle}
        </Text>
        <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
          {shift.startTime} → {shift.endTime}
        </Text>
      </View>

      <View className="justify-center pr-[18px]">
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b' }}>
          {formatDuration(shift.startTime, shift.endTime)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
