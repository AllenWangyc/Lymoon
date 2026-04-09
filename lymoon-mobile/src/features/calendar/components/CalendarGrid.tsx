import { format, getDaysInMonth, getDay, startOfMonth } from 'date-fns';
import { Text, TouchableOpacity, View } from 'react-native';
import type { MyShift } from '@/types/calendar';

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  shiftMap: Map<string, MyShift[]>;
  onDayPress: (date: string, shifts: MyShift[]) => void;
}

const TODAY = format(new Date(), 'yyyy-MM-dd');

export function CalendarGrid({ year, month, shiftMap, onDayPress }: CalendarGridProps) {
  const firstDay = startOfMonth(new Date(year, month, 1));
  // Convert getDay (0=Sun…6=Sat) to Monday-start offset (Mon=0…Sun=6)
  const startOffset = (getDay(firstDay) + 6) % 7;
  const daysInMonth = getDaysInMonth(firstDay);

  // Build flat array of cells: nulls for empty prefix + day numbers
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    cells.push(...Array(7 - remainder).fill(null));
  }

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View className="w-full">
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} className="flex-row">
          {row.map((day, colIdx) => {
            if (day === null) {
              return <View key={colIdx} className="flex-1 h-12" />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === TODAY;
            const shifts = shiftMap.get(dateStr) ?? [];
            const hasShifts = shifts.length > 0;

            return (
              <TouchableOpacity
                key={colIdx}
                className="flex-1 h-12 items-center justify-center"
                activeOpacity={hasShifts ? 0.6 : 1}
                onPress={() => hasShifts && onDayPress(dateStr, shifts)}
              >
                {/* Today circle */}
                {isToday ? (
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#5a8a00' }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                      {day}
                    </Text>
                    {hasShifts && (
                      <View
                        className="absolute rounded-full"
                        style={{ width: 5, height: 5, backgroundColor: '#fff', bottom: 2 }}
                      />
                    )}
                  </View>
                ) : (
                  <View className="items-center">
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '400',
                        color: '#0f172a',
                      }}
                    >
                      {day}
                    </Text>
                    {hasShifts && (
                      <View
                        className="rounded-full mt-0.5"
                        style={{ width: 5, height: 5, backgroundColor: '#b6ec13' }}
                      />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
