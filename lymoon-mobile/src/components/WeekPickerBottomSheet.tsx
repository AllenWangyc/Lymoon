import { useEffect, useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { BottomSheet } from './BottomSheet';

export interface WeekPickerBottomSheetProps {
  visible: boolean;
  /** Monday of the initially selected week, or null for no selection */
  initialWeekStart?: Date | null;
  onConfirm: (weekStart: Date) => void;
  onClose: () => void;
}

type DayCellState = 'out-of-month' | 'past' | 'today' | 'normal';

function getDayCellState(day: Date, displayMonth: Date, today: Date): DayCellState {
  if (!isSameMonth(day, displayMonth)) return 'out-of-month';
  if (isToday(day)) return 'today';
  if (isBefore(day, today)) return 'past';
  return 'normal';
}

function buildCalendarWeeks(monthDate: Date): Date[][] {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  return weeks;
}

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function WeekPickerBottomSheet({
  visible,
  initialWeekStart = null,
  onConfirm,
  onClose,
}: WeekPickerBottomSheetProps) {
  const today = startOfDay(new Date());

  const [displayMonth, setDisplayMonth] = useState<Date>(() => initialWeekStart ?? today);
  const [pendingWeekStart, setPendingWeekStart] = useState<Date | null>(initialWeekStart ?? null);
  const [pendingSelectedDay, setPendingSelectedDay] = useState<Date | null>(null);

  // Reset state when sheet opens
  useEffect(() => {
    if (visible) {
      setDisplayMonth(initialWeekStart ?? today);
      setPendingWeekStart(initialWeekStart ?? null);
      setPendingSelectedDay(
        initialWeekStart ? endOfWeek(initialWeekStart, { weekStartsOn: 1 }) : null,
      );
    }
  }, [visible]);

  const handleDayPress = (day: Date) => {
    if (isBefore(day, today) || !isSameMonth(day, displayMonth)) return;
    setPendingSelectedDay(day);
    setPendingWeekStart(startOfWeek(day, { weekStartsOn: 1 }));
  };

  const goToPrevMonth = () => setDisplayMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setDisplayMonth(prev => addMonths(prev, 1));

  const headerLabel: string | null = pendingWeekStart
    ? `${format(pendingWeekStart, 'MMM d')} – ${format(endOfWeek(pendingWeekStart, { weekStartsOn: 1 }), 'MMM d')}`
    : null;

  const weeks = buildCalendarWeeks(displayMonth);

  const renderWeekRow = (week: Date[], weekIndex: number) => {
    const weekStart = startOfWeek(week[0], { weekStartsOn: 1 });
    const isSelectedWeek = pendingWeekStart ? isSameDay(weekStart, pendingWeekStart) : false;

    return (
      <View key={weekIndex} className="flex-row px-6">
        {week.map((day, dayIndex) => {
          const state = getDayCellState(day, displayMonth, today);
          const inWeek = isSelectedWeek;
          const isSelectedDay = pendingSelectedDay ? isSameDay(day, pendingSelectedDay) : false;
          const isFirst = dayIndex === 0;
          const isLast = dayIndex === 6;
          const isPressable = state !== 'out-of-month' && state !== 'past';

          const textColor =
            state === 'out-of-month'
              ? '#cbd5e1'
              : state === 'past'
                ? '#94a3b8'
                : '#0f172a';

          const fontWeight: '400' | '600' | '700' =
            isSelectedDay && inWeek
              ? '700'
              : state === 'out-of-month' || state === 'past'
                ? '400'
                : '600';

          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => {
                if (isPressable) handleDayPress(day);
              }}
              className="flex-1 h-10 items-center justify-center"
            >
              {/* Week range pill background */}
              {inWeek && (
                <View
                  className="absolute inset-0"
                  style={{
                    backgroundColor: 'rgba(182,236,19,0.2)',
                    borderTopLeftRadius: isFirst ? 20 : 0,
                    borderBottomLeftRadius: isFirst ? 20 : 0,
                    borderTopRightRadius: isLast ? 20 : 0,
                    borderBottomRightRadius: isLast ? 20 : 0,
                  }}
                />
              )}

              {/* Selected day circular highlight */}
              {isSelectedDay && inWeek && (
                <View
                  className="absolute"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: 'rgba(182,236,19,0.35)',
                  }}
                />
              )}

              {/* Day number */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight,
                  color: textColor,
                  zIndex: 1,
                  lineHeight: 20,
                }}
              >
                {format(day, 'd')}
              </Text>

              {/* Today dot */}
              {(state === 'today') && (
                <View
                  className="absolute w-1.5 h-1.5 rounded-full bottom-[3px]"
                  style={{ backgroundColor: '#b6ec13' }}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={600}
      backgroundColor="#ffffff"
      borderRadius={40}
      showTopBorder={false}
      elevation={24}
      openAnimation={{ type: 'spring', damping: 20, stiffness: 200 }}
      closeAnimation={{ type: 'timing', duration: 250 }}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between px-6 pt-4 pb-[25px] border-b border-[#f8f8f6]">
        <View className="flex-1 gap-1">
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', lineHeight: 28 }}>
            Select Start Week
          </Text>
          {headerLabel ? (
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#1d2210',
                letterSpacing: -0.35,
                lineHeight: 20,
              }}
            >
              {headerLabel}
            </Text>
          ) : (
            <Text style={{ fontSize: 14, color: '#94a3b8', lineHeight: 20 }}>
              No week selected
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} className="p-2">
          <Ionicons name="close" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Date Picker Content */}
      <View className="pt-6">
        {/* Month Navigation */}
        <View className="flex-row items-center justify-between px-6 pb-6">
          <TouchableOpacity onPress={goToPrevMonth} activeOpacity={0.7} className="p-2">
            <Ionicons name="chevron-back" size={16} color="#0f172a" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', lineHeight: 28 }}>
            {format(displayMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} activeOpacity={0.7} className="p-2">
            <Ionicons name="chevron-forward" size={16} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Day Labels */}
        <View className="flex-row px-6 pb-2">
          {DAY_LABELS.map(label => (
            <View key={label} className="flex-1 items-center">
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#434934',
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Weeks */}
        <View>
          {weeks.map((week, weekIndex) => renderWeekRow(week, weekIndex))}
        </View>

        {/* Confirm Button */}
        <View className="px-6 pt-6 pb-14">
          <TouchableOpacity
            onPress={() => {
              if (pendingWeekStart) {
                onConfirm(pendingWeekStart);
                onClose();
              }
            }}
            activeOpacity={0.85}
            disabled={!pendingWeekStart}
            className="h-16 rounded-2xl items-center justify-center"
            style={{
              backgroundColor: '#b6ec13',
              opacity: pendingWeekStart ? 1 : 0.5,
              shadowColor: 'rgb(182,236,19)',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}
