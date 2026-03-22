import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { addDays, format } from 'date-fns';
import type { Shift, Employee } from '@/types/schedule';
import { TimePicker } from './TimePicker';
import { BottomSheet } from '@/components/BottomSheet';

type AddConfig = {
  mode: 'add';
  employeeId: string;
  dayOfWeek: number;
  employee: Employee;
};

type EditConfig = {
  mode: 'edit';
  shift: Shift;
  employee: Employee;
};

export type ShiftEditConfig = AddConfig | EditConfig;

export type ShiftConfirmResult = {
  mode: 'add' | 'edit';
  employeeId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  shiftId?: string;
};

type Props = {
  visible: boolean;
  config: ShiftEditConfig | null;
  weekStartDate: string;
  onClose: () => void;
  onConfirm: (result: ShiftConfirmResult) => void;
};

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function AddEditShiftBottomSheet({
  visible,
  config,
  weekStartDate,
  onClose,
  onConfirm,
}: Props) {
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && config) {
      if (config.mode === 'edit') {
        setStartTime(config.shift.startTime);
        setEndTime(config.shift.endTime);
      } else {
        setStartTime('00:00');
        setEndTime('00:00');
      }
      setError(null);
    }
  }, [visible]);

  if (!config) return null;

  const dayOfWeek = config.mode === 'edit' ? config.shift.dayOfWeek : config.dayOfWeek;
  const shiftDate = addDays(new Date(weekStartDate), dayOfWeek);
  const dateLabel = format(shiftDate, 'EEEE, MMM d').toUpperCase();
  const employee = config.employee;

  function handleConfirm() {
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      setError('End time must be after start time');
      return;
    }
    onConfirm({
      mode: config!.mode,
      employeeId: config!.mode === 'edit' ? config!.shift.employeeId : config!.employeeId,
      dayOfWeek,
      startTime,
      endTime,
      shiftId: config!.mode === 'edit' ? config!.shift.id : undefined,
    });
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} height={560}>
      {/* Content */}
      <View className="px-6 pt-4 pb-8">
        {/* Date label */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: '400',
            color: '#94a3b8',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          {dateLabel}
        </Text>

        {/* Employee row */}
        <View className="flex-row items-center gap-3 mb-6">
          <View
            className="size-8 rounded-full items-center justify-center"
            style={{
              backgroundColor: '#e2e8f0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>
              {employee.avatarInitials}
            </Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', letterSpacing: -0.3 }}>
            {employee.name}
          </Text>
        </View>

        {/* Time pickers */}
        <View className="flex-row justify-around mt-2 mb-2">
          <TimePicker label="Start" value={startTime} onChange={setStartTime} />
          <TimePicker label="End" value={endTime} onChange={setEndTime} />
        </View>

        {/* Validation error */}
        {error !== null && (
          <Text
            style={{
              fontSize: 13,
              color: '#dc2626',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            {error}
          </Text>
        )}

        {/* Confirm button */}
        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.8}
          className="items-center justify-center rounded-[16px]"
          style={{ backgroundColor: '#b6ec13', height: 56, marginTop: 24 }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
            {config.mode === 'add' ? 'Add Shift' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
