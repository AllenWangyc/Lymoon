import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';

type Category = 'shift' | 'event' | 'personal';

interface Props {
  value: Category;
  onChange: (v: Category) => void;
}

const OPTIONS: { key: Category; label: string }[] = [
  { key: 'shift', label: 'Shift' },
  { key: 'event', label: 'Event' },
  { key: 'personal', label: 'Personal' },
];

function CategoryPill({
  option,
  isSelected,
  onPress,
}: {
  option: { key: Category; label: string };
  isSelected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      scaleAnim.setValue(0.97);
      const anim = Animated.spring(scaleAnim, {
        toValue: 1.0,
        friction: 6,
        tension: 200,
        useNativeDriver: true,
      });
      anim.start();
      return () => anim.stop();
    }
  }, [isSelected, scaleAnim]);

  return (
    <Animated.View
      style={{ flex: 1, transform: [{ scale: scaleAnim }] }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className="items-center justify-center rounded-full py-[9px]"
        style={{
          backgroundColor: isSelected ? '#e8f9a3' : 'white',
          borderWidth: 1,
          borderColor: isSelected ? '#b6ec13' : 'rgba(182, 236, 19, 0.2)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#0f172a',
          }}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function CategoryPicker({ value, onChange }: Props) {
  return (
    <View className="flex-row gap-2">
      {OPTIONS.map((option) => (
        <CategoryPill
          key={option.key}
          option={option}
          isSelected={value === option.key}
          onPress={() => onChange(option.key)}
        />
      ))}
    </View>
  );
}
