import { View, Text } from 'react-native';
import type { Shift } from '@/types/schedule';

type Props = {
  shift: Shift;
};

export function ShiftCard({ shift }: Props) {
  return (
    <View
      className="rounded-[12px] px-[17px] py-[13px] min-w-[120px] self-stretch"
      style={{
        backgroundColor: 'rgba(182,236,19,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(182,236,19,0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: '#64748b',
          letterSpacing: -0.25,
          textTransform: 'uppercase',
          lineHeight: 15,
        }}
      >
        {shift.shiftType}
      </Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', lineHeight: 20 }}>
        {shift.startTime} – {shift.endTime}
      </Text>
    </View>
  );
}
