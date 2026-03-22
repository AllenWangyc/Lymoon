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
      className="min-w-[120px] self-stretch items-center justify-center rounded-[12px] bg-[#f1f5f9] border border-[#cbd5e1] border-dashed px-[51px] py-[13px]"
    >
      <Ionicons name="add" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );
}
