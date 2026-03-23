import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'join') => void;
}

export function NewScheduleBottomSheet({ visible, onClose, onSelect }: Props) {
  function handleCreate() {
    router.push('/create-schedule');
    onClose();
  }

  function handleJoin() {
    onSelect('join');
    onClose();
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={320}
      backgroundColor="#fcfcfb"
      backdropOpacity={0.4}
    >
      {/* Options */}
      <View className="px-6 pb-10 pt-2 gap-3">
        {/* Create New Schedule */}
        <TouchableOpacity
          onPress={handleCreate}
          activeOpacity={0.7}
          className="bg-white border border-[#f1f5f9] rounded-[16px] flex-row items-center gap-4 p-[17px]"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
        >
          <View className="bg-[rgba(182,236,19,0.1)] rounded-[12px] size-12 items-center justify-center">
            <Ionicons name="calendar-outline" size={22} color="#84cc16" />
          </View>
          <View className="flex-1">
            <Text className="text-[16px] font-bold text-[#0f172a]">Create New Schedule</Text>
            <Text className="text-[12px] text-[#64748b] leading-4">Start a fresh project timeline</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
        </TouchableOpacity>

        {/* Join with Code */}
        <TouchableOpacity
          onPress={handleJoin}
          activeOpacity={0.7}
          className="bg-white border border-[#f1f5f9] rounded-[16px] flex-row items-center gap-4 p-[17px]"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
        >
          <View className="bg-[rgba(182,236,19,0.1)] rounded-[12px] size-12 items-center justify-center">
            <Ionicons name="people-outline" size={22} color="#84cc16" />
          </View>
          <View className="flex-1">
            <Text className="text-[16px] font-bold text-[#0f172a]">Join with Code</Text>
            <Text className="text-[12px] text-[#64748b] leading-4">Enter a shared invite code</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} className="items-center justify-center py-4">
          <Text className="text-[14px] font-semibold text-[#64748b]">Cancel</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
