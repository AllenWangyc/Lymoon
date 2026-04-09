import { format, parseISO } from 'date-fns';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import type { MyShift } from '@/types/calendar';

interface DayShiftSheetProps {
  visible: boolean;
  date: string | null;      // "YYYY-MM-DD"
  shifts: MyShift[];
  onClose: () => void;
  onShiftPress: (scheduleId: string) => void;
}

const SHIFT_TYPE_LABELS: Record<string, string> = {
  Morning: 'Morning',
  Standard: 'Standard',
  Afternoon: 'Afternoon',
  Custom: 'Custom',
};

export function DayShiftSheet({ visible, date, shifts, onClose, onShiftPress }: DayShiftSheetProps) {
  const formattedDate = date
    ? format(parseISO(date), 'EEEE, MMMM d')
    : '';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={340}
    >
      <View className="px-5 pt-1 pb-6">
        {/* Header */}
        <Text
          style={{ fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 16 }}
        >
          {formattedDate}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {shifts.map((shift, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => onShiftPress(shift.scheduleId)}
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
              {/* Schedule color dot */}
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

              {/* Shift type badge */}
              <View
                className="rounded-full px-2.5 py-0.5"
                style={{ backgroundColor: 'rgba(182,236,19,0.15)' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#5a8a00' }}>
                  {SHIFT_TYPE_LABELS[shift.shiftType] ?? shift.shiftType}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}
