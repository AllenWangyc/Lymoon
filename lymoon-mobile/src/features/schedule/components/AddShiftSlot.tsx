import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  onPress: () => void;
};

export function AddShiftSlot({ onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      className="min-w-[120px] self-stretch items-center justify-center rounded-[12px]"
      style={{
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed',
        paddingHorizontal: 51,
        paddingVertical: 13,
      }}
    >
      <Ionicons name="add" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );
}
