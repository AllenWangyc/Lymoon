import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
};

const WARNING_ITEMS = ['Your schedules', 'Your shifts', 'Your data'];

export function DeleteAccountSheet({ visible, onClose, onConfirm, isLoading }: Props) {
  const [input, setInput] = useState('');

  const canDelete = input === 'DELETE';

  function handleClose() {
    setInput('');
    onClose();
  }

  function handleConfirm() {
    if (!canDelete || isLoading) return;
    setInput('');
    onConfirm();
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} height={380} keyboardAware>
      <View className="px-6 pt-2 pb-8 gap-5">
        {/* Title */}
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#0f172a' }}>
          Delete Account
        </Text>

        {/* Warning list */}
        <View className="gap-2">
          <Text style={{ fontSize: 14, color: '#64748b' }}>
            This will permanently delete:
          </Text>
          {WARNING_ITEMS.map((item) => (
            <View key={item} className="flex-row items-center gap-2">
              <Text style={{ fontSize: 14, color: '#ef4444' }}>•</Text>
              <Text style={{ fontSize: 14, color: '#0f172a' }}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Confirmation input */}
        <View className="bg-white border border-[#e2e8f0] rounded-2xl px-4 h-14 flex-row items-center">
          <TextInput
            className="flex-1"
            value={input}
            onChangeText={setInput}
            placeholder="Type DELETE to confirm"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
            style={{ fontSize: 15, color: '#0f172a' }}
          />
        </View>

        {/* Delete button */}
        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.85}
          disabled={!canDelete || isLoading}
          className="bg-[#ef4444] h-14 rounded-2xl items-center justify-center"
          style={!canDelete || isLoading ? { opacity: 0.4 } : undefined}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#ffffff' }}>
            {isLoading ? 'Deleting…' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
