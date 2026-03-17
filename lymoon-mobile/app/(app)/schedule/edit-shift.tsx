import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function EditShiftScreen() {
  const { shiftId } = useLocalSearchParams<{ shiftId: string }>();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#f8f8f6]" style={{ paddingTop: insets.top }}>
      <View className="px-6 py-4 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="size-10 rounded-full bg-white items-center justify-center border border-[#f1f5f9]"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
        >
          <Ionicons name="chevron-back" size={16} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>Edit Shift</Text>
      </View>

      <View className="flex-1 items-center justify-center gap-2">
        <Text style={{ fontSize: 14, color: '#94a3b8' }}>Shift ID: {shiftId}</Text>
        <Text style={{ fontSize: 14, color: '#94a3b8' }}>Edit form coming soon</Text>
      </View>
    </View>
  );
}
