import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SchedulePreviewCardProps {
  scheduleName: string;
  managerName: string;
  memberCount: number;
}

export function SchedulePreviewCard({
  scheduleName,
  managerName,
  memberCount,
}: SchedulePreviewCardProps) {
  return (
    <View
      className="bg-white border border-[#f1f5f9] rounded-[16px] p-[21px] gap-3 w-full"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      <Text className="text-[20px] font-bold text-[#0f172a] mb-1">{scheduleName}</Text>

      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="person-outline" size={12} color="#64748b" />
          <Text className="text-[14px] text-[#64748b]">Managed by {managerName}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Ionicons name="people-outline" size={12} color="#64748b" />
          <Text className="text-[14px] text-[#64748b]">{memberCount} Members joined</Text>
        </View>
      </View>
    </View>
  );
}
