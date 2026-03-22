import { View, Text, TouchableOpacity } from 'react-native';
import { format, addDays } from 'date-fns';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type Props = {
  weekStartDate: Date;
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
};

export function DaySelector({ weekStartDate, selectedDayIndex, onSelectDay }: Props) {
  return (
    <View className="flex-row items-center justify-between w-full pb-2">
      {DAY_LABELS.map((label, i) => {
        const date = addDays(weekStartDate, i);
        const dayNumber = format(date, 'd');
        const isSelected = i === selectedDayIndex;

        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelectDay(i)}
            activeOpacity={0.7}
            className="items-center min-w-[48px]"
          >
            <Text
              className="pb-1"
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: isSelected ? '#0f172a' : '#94a3b8',
              }}
            >
              {label}
            </Text>

            <View
              className={isSelected ? 'rounded-full py-1 px-3 bg-[#b6ec13]' : ''}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isSelected ? '700' : '600',
                  color: '#0f172a',
                  lineHeight: 20,
                }}
              >
                {dayNumber}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
