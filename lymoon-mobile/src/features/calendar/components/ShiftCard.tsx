import { Text, TouchableOpacity, View } from 'react-native';
import type { MyShift } from '@/types/calendar';

interface ShiftCardProps {
  shift: MyShift;
  onPress: () => void;
}

const SHIFT_TYPE_LABELS: Record<string, string> = {
  Morning: 'Morning',
  Standard: 'Standard',
  Afternoon: 'Afternoon',
  Custom: 'Custom',
};

export function ShiftCard({ shift, onPress }: ShiftCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center bg-white rounded-xl px-4 py-3 mb-2"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View
        className="rounded-full mr-3"
        style={{ width: 10, height: 10, backgroundColor: shift.scheduleIconBg }}
      />

      <View className="flex-1">
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>
          {shift.scheduleTitle}
        </Text>
        <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
          {shift.startTime} → {shift.endTime}
        </Text>
      </View>

      <View
        className="rounded-full px-2.5 py-0.5"
        style={{ backgroundColor: 'rgba(182,236,19,0.15)' }}
      >
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#5a8a00' }}>
          {SHIFT_TYPE_LABELS[shift.shiftType] ?? shift.shiftType}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
