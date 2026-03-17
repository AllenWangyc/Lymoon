import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDays, format } from 'date-fns';
import type { Shift, Employee } from '@/types/schedule';

type Props = {
  visible: boolean;
  shift: Shift | null;
  employee: Employee | null;
  weekStartDate: string;
  isManager: boolean;
  onClose: () => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shift: Shift) => void;
};

const SHEET_HEIGHT = 420;
const ANIMATION_DURATION = 280;

export function ShiftDetailBottomSheet({
  visible,
  shift,
  employee,
  weekStartDate,
  isManager,
  onClose,
  onEditShift,
  onDeleteShift,
}: Props) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(SHEET_HEIGHT);
    }
  }, [visible]);

  if (!shift || !employee) return null;

  const shiftDate = addDays(new Date(weekStartDate), shift.dayOfWeek);
  const dateLabel = format(shiftDate, 'EEEE, MMM d').toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="absolute inset-0 bg-[rgba(15,23,42,0.6)]" />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <Animated.View
          style={[
            {
              transform: [{ translateY }],
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.5)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: 0.1,
              shadowRadius: 25,
              elevation: 20,
            },
          ]}
          className="bg-[#f8f8f6] rounded-tl-[32px] rounded-tr-[32px]"
        >
          {/* Drag handle */}
          <View className="h-[24px] items-center justify-center pt-2">
            <View className="bg-[#cbd5e1] w-12 h-[6px] rounded-full" />
          </View>

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
              {isManager && (
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
        </Animated.View>
      </View>
    </Modal>
  );
}
