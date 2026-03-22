import { TouchableOpacity, View, Text } from 'react-native';
import type { Shift } from '@/types/schedule';

type Props = {
  shift: Shift;
  onPress?: () => void;
};

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

export function ShiftCard({ shift, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} disabled={!onPress}>
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
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', lineHeight: 20 }}>
        {shift.startTime} - {shift.endTime}
      </Text>
      <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748b', lineHeight: 16 }}>
        {formatDuration(shift.startTime, shift.endTime)}
      </Text>
    </View>
    </TouchableOpacity>
  );
}
