import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CalendarScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6] items-center justify-center">
      <Text className="text-[18px] font-bold text-[#0f172a]">Calendar</Text>
      <Text className="text-[14px] text-[#64748b] mt-1">Coming soon</Text>
    </SafeAreaView>
  );
}
