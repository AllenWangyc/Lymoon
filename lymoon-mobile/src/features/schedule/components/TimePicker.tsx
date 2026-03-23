import { View, Text } from 'react-native';
import { TimeWheelPicker } from './TimeWheelPicker';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '10', '20', '30', '40', '50'];

type Props = {
  label: string;
  value: string; // "HH:MM" 24h format
  onChange: (value: string) => void;
};

function parseTime(value: string): { hourIndex: number; minuteIndex: number } {
  const [h, m] = value.split(':');
  const minuteIndex = MINUTES.indexOf(m);
  return {
    hourIndex: parseInt(h, 10),
    minuteIndex: minuteIndex === -1 ? 0 : minuteIndex,
  };
}

function buildTime(hourIndex: number, minuteIndex: number): string {
  return `${HOURS[hourIndex]}:${MINUTES[minuteIndex]}`;
}

export function TimePicker({ label, value, onChange }: Props) {
  const { hourIndex, minuteIndex } = parseTime(value);

  return (
    <View className="items-center gap-3">
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: '#94a3b8',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <View className="flex-row items-center gap-1">
        <TimeWheelPicker
          items={HOURS}
          selectedIndex={hourIndex}
          onChange={(i) => onChange(buildTime(i, parseTime(value).minuteIndex))}
        />
        <Text className="pb-1" style={{ fontSize: 22, fontWeight: '700', color: '#0f172a' }}>
          :
        </Text>
        <TimeWheelPicker
          items={MINUTES}
          selectedIndex={minuteIndex}
          onChange={(i) => onChange(buildTime(parseTime(value).hourIndex, i))}
        />
      </View>
    </View>
  );
}
