import { Animated, TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastProps = {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  translateY: Animated.Value;
  topOffset: number;
};

export function Toast({ message, type = 'success', onClose, translateY, topOffset }: ToastProps) {
  const iconName = type === 'success' ? 'checkmark' : 'close';
  const iconColor = type === 'success' ? '#b6ec13' : '#ef4444';
  const iconBg = type === 'success' ? 'rgba(182,236,19,0.2)' : 'rgba(239,68,68,0.1)';
  const borderColor = type === 'success' ? 'rgba(182,236,19,0.2)' : 'rgba(239,68,68,0.15)';

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY }],
          top: topOffset,
          position: 'absolute',
          left: 24,
          right: 24,
          zIndex: 999,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.1,
          shadowRadius: 25,
          elevation: 12,
          borderWidth: 1,
          borderColor,
          borderRadius: 16,
          backgroundColor: 'rgba(255,255,255,0.97)',
        },
      ]}
    >
      <View className="flex-row items-center p-[17px] gap-3">
        <View
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: iconBg }}
          className="items-center justify-center"
        >
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <Text className="flex-1 text-[14px] font-semibold text-[#0f172a]">{message}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
