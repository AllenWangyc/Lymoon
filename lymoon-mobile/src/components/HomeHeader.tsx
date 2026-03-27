import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { UserAvatar } from '@/components/UserAvatar';

export function HomeHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userName = useAuthStore((s) => s.userName!);
  const avatarInitials = useAuthStore((s) => s.avatarInitials!);

  return (
    <View
      className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-6 pb-4"
      style={{
        paddingTop: insets.top + 8,
        backgroundColor: 'rgba(248,248,246,0.92)',
        borderBottomWidth: 0,
        zIndex: 10,
      }}
    >
      {/* Left: Avatar + greeting */}
      <View className="flex-row items-center gap-3">
        <UserAvatar name={userName} initials={avatarInitials} size={40} />

        <View className="gap-px">
          <Text className="text-[12px] font-medium text-[#64748b]">Welcome back,</Text>
          <Text className="text-[18px] font-bold text-[#0f172a]">{userName}</Text>
        </View>
      </View>

      {/* Right: Notification bell */}
      <TouchableOpacity
        onPress={() => router.push('/notifications')}
        activeOpacity={0.7}
        className="w-10 h-10 bg-white rounded-full items-center justify-center border border-[#f1f5f9]"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <Ionicons name="notifications-outline" size={20} color="#0f172a" />
      </TouchableOpacity>
    </View>
  );
}
