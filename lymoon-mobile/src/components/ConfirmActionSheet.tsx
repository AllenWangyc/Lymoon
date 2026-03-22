import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/BottomSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  confirmColor?: string;
};

export function ConfirmActionSheet({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  iconName,
  iconColor,
  iconBg,
  confirmColor = '#dc2626',
}: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} height={320}>
      <View className="px-6 pt-6 pb-6 gap-6">
        {/* Icon + text */}
        <View className="items-center gap-4">
          <View
            className="size-14 rounded-full items-center justify-center"
            style={{ backgroundColor: iconBg }}
          >
            <Ionicons name={iconName} size={28} color={iconColor} />
          </View>
          <View className="items-center gap-3">
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#1e293b', textAlign: 'center' }}>
              {title}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18 }}>
              {message}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onConfirm}
            className="h-12 rounded-[12px] items-center justify-center"
            style={{ backgroundColor: confirmColor }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>{confirmLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onClose}
            className="h-12 rounded-[12px] items-center justify-center border border-[#e2e8f0]"
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>{cancelLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}
