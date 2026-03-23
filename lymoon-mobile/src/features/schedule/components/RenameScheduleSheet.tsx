import { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';

const MAX_LENGTH = 20;

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  currentName: string;
};

export function RenameScheduleSheet({ visible, onClose, onConfirm, currentName }: Props) {
  const [value, setValue] = useState(currentName);

  useEffect(() => {
    if (visible) {
      setValue(currentName);
    }
  }, [visible, currentName]);

  const trimmed = value.trim();
  const canSave = trimmed.length > 0 && trimmed !== currentName.trim();

  function handleConfirm() {
    if (!canSave) return;
    onConfirm(trimmed);
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} height={280} keyboardAware>
      <View className="px-6 pt-2 pb-8 gap-5">
        {/* Title */}
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#0f172a' }}>
          Rename Schedule
        </Text>

        {/* Input */}
        <View className="gap-2">
          <View className="bg-white border border-[#e2e8f0] rounded-2xl px-4 h-14 flex-row items-center">
            <TextInput
              className="flex-1"
              value={value}
              onChangeText={setValue}
              maxLength={MAX_LENGTH}
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              autoFocus
              style={{ fontSize: 15, color: '#0f172a' }}
            />
          </View>
          <Text
            className="text-right"
            style={{ fontSize: 12, color: '#94a3b8' }}
          >
            {value.length}/{MAX_LENGTH}
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.85}
          disabled={!canSave}
          className="bg-[#b6ec13] h-14 rounded-2xl items-center justify-center"
          style={!canSave ? { opacity: 0.4 } : undefined}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
