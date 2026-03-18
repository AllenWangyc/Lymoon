import { useEffect, useRef, useState } from 'react';
import { Animated, TextInput, TouchableOpacity, View, Text } from 'react-native';

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
  autoFocus?: boolean;
  hasError?: boolean;
  hasSuccess?: boolean;
  hasJoined?: boolean;
  isLoading?: boolean;
}

const CELL_COUNT = 6;

export function OTPInput({ value, onChange, autoFocus = false, hasError = false, hasSuccess = false, hasJoined = false, isLoading = false }: OTPInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  function handleChangeText(text: string) {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CELL_COUNT);
    onChange(cleaned);
  }

  useEffect(() => {
    if (!hasError) return;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  }, [hasError]);

  useEffect(() => {
    if (isLoading) {
      pulseAnim.setValue(1);
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.45, duration: 450, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 450, useNativeDriver: true }),
        ])
      );
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [isLoading]);

  // Active cell = first empty slot, capped at last cell.
  // When all 6 are filled and input is focused, last cell stays highlighted
  // as a visual "ready to submit" indicator.
  const activeCellIndex = Math.min(value.length, CELL_COUNT - 1);

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
      <Animated.View
        className="flex-row justify-between w-full"
        style={{ transform: [{ translateX: shakeAnim }], opacity: pulseAnim }}
      >
        {Array.from({ length: CELL_COUNT }).map((_, index) => {
          const isActive = isFocused && index === activeCellIndex && !hasError && !hasSuccess && !hasJoined && !isLoading;
          const borderColor = hasError ? '#ef4444'
            : hasJoined ? '#3B82F6'
            : (hasSuccess || isActive) ? '#22c55e'
            : '#e2e8f0';
          const glowColor = hasError ? '#ef4444'
            : hasJoined ? '#3B82F6'
            : '#22c55e';
          const showGlow = hasError || hasJoined || hasSuccess || isActive;
          return (
            <View
              key={index}
              className="w-[52px] h-[72px] rounded-[12px] border-2 items-center justify-center bg-[#f8fafc]"
              style={[
                { borderColor },
                showGlow && {
                  shadowColor: glowColor,
                  shadowOpacity: hasError ? 0.2 : 0.3,
                  shadowRadius: hasError ? 6 : 8,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: hasError ? 3 : 4,
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
      </Animated.View>
    </TouchableOpacity>
  );
}
