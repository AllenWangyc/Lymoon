// app/(app)/notifications/index.tsx
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, ListRenderItemInfo } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications, useMarkNotificationsRead } from '@/lib/queries/notifications';

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  shift_modified: 'Shift Modified',
  shift_deleted: 'Shift Deleted',
  new_week_added: 'New Week Added',
  removed_from_schedule: 'Removed from Schedule',
};

function NotificationItem({ item }: { item: Notification }) {
  const typeLabel = TYPE_LABELS[item.type] ?? item.type;
  const relativeTime = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

  return (
    <View className={`flex-row items-start px-5 py-4 border-b border-white/10 ${item.isRead ? '' : 'bg-white/5'}`}>
      {!item.isRead && (
        <View className="w-2 h-2 rounded-full bg-[#b6ec13] mt-1.5 mr-3 flex-shrink-0" />
      )}
      {item.isRead && <View className="w-2 h-2 mr-3 flex-shrink-0" />}
      <View className="flex-1">
        <Text
          style={{ fontSize: 12, fontWeight: '600', color: '#b6ec13', letterSpacing: 0.4 }}
          className="mb-1"
        >
          {typeLabel}
        </Text>
        <Text style={{ fontSize: 14, color: '#ffffff', lineHeight: 20 }} className="mb-1">
          {item.message}
        </Text>
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>{relativeTime}</Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  function handleMarkAllRead() {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    markRead.mutate(unreadIds);
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View className="flex-1 bg-[#111111]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-16 pb-4">
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#ffffff' }}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#b6ec13' }}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#b6ec13" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
            No notifications
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item: Notification) => item.id}
          renderItem={({ item }: ListRenderItemInfo<Notification>) => (
            <NotificationItem item={item} />
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}
