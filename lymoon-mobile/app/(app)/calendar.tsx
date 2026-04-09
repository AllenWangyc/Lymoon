import { useCallback, useRef, useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addMonths, format, subMonths } from 'date-fns';
import { CalendarGrid } from '@/features/calendar/components/CalendarGrid';
import { DayShiftSheet } from '@/features/calendar/components/DayShiftSheet';
import { useMyShifts } from '@/lib/queries/shifts';
import type { MyShift } from '@/types/calendar';

const MONTHS_BEFORE = 6;
const MONTHS_AFTER = 6;

function buildMonthRange() {
  const now = new Date();
  const months: { year: number; month: number }[] = [];
  for (let i = -MONTHS_BEFORE; i <= MONTHS_AFTER; i++) {
    const d = addMonths(now, i);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return months;
}

const MONTHS = buildMonthRange();
const TODAY = new Date();
const FROM = format(subMonths(TODAY, MONTHS_BEFORE), 'yyyy-MM-dd');
const TO = format(addMonths(TODAY, MONTHS_AFTER), 'yyyy-MM-dd');
const CURRENT_MONTH_IDX = MONTHS_BEFORE; // index of current month in MONTHS array

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function CalendarScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const hasScrolled = useRef(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedShifts, setSelectedShifts] = useState<MyShift[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);

  const { data: shiftMap = new Map() } = useMyShifts(FROM, TO);

  const handleDayPress = useCallback((date: string, shifts: MyShift[]) => {
    setSelectedDate(date);
    setSelectedShifts(shifts);
    setSheetVisible(true);
  }, []);

  const handleShiftPress = useCallback((scheduleId: string) => {
    setSheetVisible(false);
    router.push(`/(app)/schedule/${scheduleId}` as never);
  }, []);

  const handleMonthLayout = useCallback(
    (e: { nativeEvent: { layout: { y: number } } }, idx: number) => {
      if (idx === CURRENT_MONTH_IDX && !hasScrolled.current && scrollRef.current) {
        hasScrolled.current = true;
        const y = e.nativeEvent.layout.y;
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y, animated: false });
        }, 50);
      }
    },
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]" edges={['top']}>
      {/* App bar */}
      <View
        className="h-16 px-4 justify-center"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(182,236,19,0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: -0.45 }}>
          Calendar
        </Text>
      </View>

      {/* Fixed weekday header */}
      <View
        className="flex-row px-4 py-3"
        style={{
          backgroundColor: 'rgba(248,248,246,0.95)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(225,228,208,0.3)',
        }}
      >
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} className="flex-1 items-center">
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8' }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Scrollable months */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {MONTHS.map(({ year, month }, idx) => (
          <View
            key={`${year}-${month}`}
            className="px-4"
            style={{ paddingTop: 24, paddingBottom: 8 }}
            onLayout={(e) => handleMonthLayout(e as never, idx)}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: 12,
                paddingHorizontal: 4,
              }}
            >
              {format(new Date(year, month, 1), 'MMMM yyyy')}
            </Text>
            <CalendarGrid
              year={year}
              month={month}
              shiftMap={shiftMap}
              onDayPress={handleDayPress}
            />
          </View>
        ))}
      </ScrollView>

      <DayShiftSheet
        visible={sheetVisible}
        date={selectedDate}
        shifts={selectedShifts}
        onClose={() => setSheetVisible(false)}
        onShiftPress={handleShiftPress}
      />
    </SafeAreaView>
  );
}
