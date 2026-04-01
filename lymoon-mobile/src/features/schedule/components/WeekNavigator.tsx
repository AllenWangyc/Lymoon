import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays } from 'date-fns';

type Props = {
  weekStartDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  isAtLatestWeek: boolean;
};

export function WeekNavigator({ weekStartDate, onPrevWeek, onNextWeek, isAtLatestWeek }: Props) {
  const weekEndDate = addDays(weekStartDate, 6);
  const label = `${format(weekStartDate, 'MMM d')} – ${format(weekEndDate, 'MMM d')}`;

  return (
    <View className="items-center">
      <View
        className="flex-row items-center gap-3 bg-white border border-[#f1f5f9] rounded-full px-4 py-[9px]"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
      >
        <TouchableOpacity onPress={onPrevWeek} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={14} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>{label}</Text>
        <TouchableOpacity
          onPress={onNextWeek}
          disabled={isAtLatestWeek}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-forward" size={14} color={isAtLatestWeek ? '#cbd5e1' : '#0f172a'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
