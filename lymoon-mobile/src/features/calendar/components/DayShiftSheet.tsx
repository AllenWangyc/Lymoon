import { format, parseISO } from 'date-fns';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import type { MyShift } from '@/types/calendar';
import { ShiftCard } from './ShiftCard';

interface DayShiftSheetProps {
  visible: boolean;
  date: string | null;      // "YYYY-MM-DD"
  shifts: MyShift[];
  onClose: () => void;
  onShiftPress: (scheduleId: string) => void;
}

export function DayShiftSheet({ visible, date, shifts, onClose, onShiftPress }: DayShiftSheetProps) {
  const formattedDate = date
    ? format(parseISO(date), 'EEEE, MMMM d')
    : '';

  const { height: screenHeight } = useWindowDimensions();
  const sheetHeight = Math.min(340, screenHeight * 0.5);

  return (
    <BottomSheet visible={visible} onClose={onClose} height={sheetHeight}>
      <View className="px-5 pt-1 pb-6" style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 16 }}>
          {formattedDate}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {shifts.map((shift, idx) => (
            <ShiftCard
              key={idx}
              shift={shift}
              onPress={() => onShiftPress(shift.scheduleId)}
            />
          ))}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}
