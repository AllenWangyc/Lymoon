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
      className="absolute left-6 right-6 z-[999] border rounded-2xl bg-white/[97]"
      style={{
        transform: [{ translateY }],
        top: topOffset,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 25,
        elevation: 12,
        borderColor,
      }}
    >
      <View className="flex-row items-center p-[17px] gap-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: iconBg }}
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
