import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDays, format } from 'date-fns';
import type { Shift, Employee } from '@/types/schedule';
import { BottomSheet } from '@/components/BottomSheet';

type Props = {
  visible: boolean;
  shift: Shift | null;
  employee: Employee | null;
  weekStartDate: string;
  canEdit: boolean;
  onClose: () => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shift: Shift) => void;
};

export function ShiftDetailBottomSheet({
  visible,
  shift,
  employee,
  weekStartDate,
  canEdit,
  onClose,
  onEditShift,
  onDeleteShift,
}: Props) {
  if (!shift || !employee) return null;

  const shiftDate = addDays(new Date(weekStartDate), shift.dayOfWeek);
  const dateLabel = format(shiftDate, 'EEEE, MMM d').toUpperCase();

  return (
    <BottomSheet visible={visible} onClose={onClose} height={420}>
      {/* Content */}
      <View className="px-6 pt-4 pb-8">
        {/* Header: date + time range */}
        <View
          className="rounded-[16px] items-center justify-center py-[18px] mb-11"
          style={{ backgroundColor: '#f8f8f6', borderWidth: 1, borderColor: '#f8f8f6' }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '400',
              color: '#94a3b8',
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            {dateLabel}
          </Text>
          <Text
            style={{
              fontSize: 30,
              fontWeight: '700',
              color: '#0f172a',
              lineHeight: 30,
            }}
          >
            {shift.startTime} - {shift.endTime}
          </Text>
        </View>

        {/* Employee info */}
        <View className="flex-row items-center gap-4 px-2 mb-6">
          <View
            className="size-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: '#e2e8f0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
              {employee.avatarInitials}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', letterSpacing: -0.5 }}>
            {employee.name}
          </Text>
        </View>

        {/* Actions */}
        <View className="gap-5">
          {canEdit && (
            <>
              <TouchableOpacity
                onPress={() => onEditShift(shift)}
                activeOpacity={0.8}
                className="flex-row items-center justify-center gap-2 rounded-[12px] h-14"
                style={{ backgroundColor: '#b6ec13' }}
              >
                <Ionicons name="pencil" size={18} color="#0f172a" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
                  Edit Shift
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onDeleteShift(shift)}
                activeOpacity={0.7}
                className="flex-row items-center justify-center gap-2 h-14 rounded-[12px]"
              >
                <Ionicons name="trash-outline" size={16} color="#dc2626" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#dc2626' }}>
                  Delete
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </BottomSheet>
  );
}
