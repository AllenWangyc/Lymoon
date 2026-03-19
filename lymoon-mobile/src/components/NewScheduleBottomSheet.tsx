import { useEffect, useRef } from 'react';
import { Animated, Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'create' | 'join') => void;
}

const SHEET_HEIGHT = 320;
const ANIMATION_DURATION = 280;

export function NewScheduleBottomSheet({ visible, onClose, onSelect }: Props) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(SHEET_HEIGHT);
    }
  }, [visible]);

  function handleCreate() {
    router.push('/create-schedule');
    onClose();
  }

  function handleJoin() {
    onSelect('join');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Backdrop — appears instantly, no animation */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="absolute inset-0 bg-[rgba(15,23,42,0.4)]" />
        </TouchableWithoutFeedback>

        {/* Sheet — slides up */}
        <Animated.View
          style={[
            { transform: [{ translateY }], borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.5)', shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 30, elevation: 20 },
          ]}
          className="bg-[#fcfcfb] rounded-tl-[32px] rounded-tr-[32px] pb-10 pt-[13px] px-6"
        >
          {/* Drag handle */}
          <View className="items-center mb-6">
            <View className="bg-[#e2e8f0] rounded-full w-12 h-[6px]" />
          </View>

          {/* Options */}
          <View className="gap-3">
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
                <Text className="text-[12px] text-[#64748b]" style={{ lineHeight: 16 }}>Start a fresh project timeline</Text>
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
                <Text className="text-[12px] text-[#64748b]" style={{ lineHeight: 16 }}>Enter a shared invite code</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} className="items-center justify-center py-4">
              <Text className="text-[14px] font-semibold text-[#64748b]">Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
