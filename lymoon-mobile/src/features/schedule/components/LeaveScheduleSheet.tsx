import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/BottomSheet';

type Props = {
  visible: boolean;
  scheduleName: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function LeaveScheduleSheet({ visible, scheduleName, onClose, onConfirm }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} height={320}>
      <View className="px-6 pt-6 pb-6 gap-6">
        {/* Icon + text */}
        <View className="items-center gap-4">
          <View
            className="size-14 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}
          >
            <Ionicons name="warning-outline" size={28} color="#f59e0b" />
          </View>
          <View className="items-center gap-3">
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#1e293b', textAlign: 'center' }}>
              Leave Schedule?
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18 }}>
              You'll lose access to "{scheduleName}" and its shifts. You can rejoin using the invite code.
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onConfirm}
            className="h-12 rounded-[12px] items-center justify-center"
            style={{ backgroundColor: '#dc2626' }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Leave</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onClose}
            className="h-12 rounded-[12px] items-center justify-center border border-[#e2e8f0]"
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}
