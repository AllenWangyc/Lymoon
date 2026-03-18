import { useRef, useState } from 'react';
import { TextInput, TouchableOpacity, View, Text } from 'react-native';

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
  autoFocus?: boolean;
}

const CELL_COUNT = 6;

export function OTPInput({ value, onChange, autoFocus = false }: OTPInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  function handleChangeText(text: string) {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CELL_COUNT);
    onChange(cleaned);
  }

  // Active cell = first empty slot, capped at last cell.
  // When all 6 are filled and input is focused, last cell stays highlighted
  // as a visual "ready to submit" indicator.
  const activeCellIndex = Math.min(value.length, CELL_COUNT - 1);

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
      <View className="flex-row justify-between w-full">
        {Array.from({ length: CELL_COUNT }).map((_, index) => {
          const isActive = isFocused && index === activeCellIndex;
          return (
            <View
              key={index}
              className="w-[52px] h-[72px] rounded-[12px] border-2 items-center justify-center bg-[#f8fafc]"
              style={[
                { borderColor: isActive ? '#22c55e' : '#e2e8f0' },
                isActive && {
                  shadowColor: '#22c55e',
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 4,
                },
              ]}
            >
              <Text className="text-[24px] font-bold text-[#0f172a]">
                {value[index] ?? ''}
              </Text>
            </View>
          );
        })}

        {/* Hidden TextInput — captures all keyboard input */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          autoFocus={autoFocus}
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType="default"
          caretHidden
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute w-full h-full opacity-0"
          style={{ color: 'transparent' }}
        />
      </View>
    </TouchableOpacity>
  );
}
