import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type HintStatus = 'error' | 'success' | 'joined';

interface CodeInputHintProps {
  status: HintStatus;
  message: string;
}

const HINT_CONFIG: Record<HintStatus, { icon: string; color: string; weight: 'medium' | 'normal' }> = {
  error:   { icon: 'alert-circle',       color: '#ef4444', weight: 'medium' },
  success: { icon: 'checkmark-circle',   color: '#22c55e', weight: 'normal' },
  joined:  { icon: 'information-circle', color: '#3B82F6', weight: 'normal' },
};

export function CodeInputHint({ status, message }: CodeInputHintProps) {
  const { icon, color, weight } = HINT_CONFIG[status];

  return (
    <View className="flex-row items-center gap-1.5 mt-1 px-1">
      <Ionicons name={icon as any} size={14} color={color} />
      <Text
        className={`text-[12px] ${weight === 'medium' ? 'font-medium' : ''}`}
        style={{ color }}
      >
        {message}
      </Text>
    </View>
  );
}
