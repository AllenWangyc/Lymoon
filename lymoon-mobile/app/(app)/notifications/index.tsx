// app/(app)/notifications/index.tsx
import { View, Text, FlatList, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications, useMarkNotificationsRead, type Notification } from '@/lib/queries/notifications';
import { useToast } from '@/hooks/useToast';

const TYPE_LABELS: Record<string, string> = {
  shift_modified: 'Shift Modified',
  shift_deleted: 'Shift Deleted',
  new_week_added: 'New Week Added',
  removed_from_schedule: 'Removed from Schedule',
};

function formatRelativeTime(createdAt: string): string {
  try {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  } catch {
    return '';
  }
}

function NotificationItem({ item }: { item: Notification }) {
  const typeLabel = TYPE_LABELS[item.type] ?? item.type;

  return (
    <View className={`flex-row items-start px-5 py-4 border-b border-white/10 ${item.isRead ? '' : 'bg-white/5'}`}>
      <View className={`w-2 h-2 rounded-full mt-1.5 mr-3 flex-shrink-0 ${item.isRead ? '' : 'bg-[#b6ec13]'}`} />
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
        <Text style={{ fontSize: 12, color: '#9ca3af' }}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const { data: notifications = [], isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  function handleMarkAllRead() {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    markRead.mutate(unreadIds, {
      onError: () => showToast('Failed to mark notifications as read'),
    });
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View className="flex-1 bg-[#111111]">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pb-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#ffffff' }}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
            disabled={markRead.isPending}
          >
            <Text style={{ fontSize: 14, fontWeight: '500', color: markRead.isPending ? '#6b7280' : '#b6ec13' }}>
              {markRead.isPending ? 'Marking...' : 'Mark all read'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#b6ec13" />
        </View>
      ) : isError ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
          refreshControl={
            <RefreshControl onRefresh={refetch} refreshing={isLoading} tintColor="#b6ec13" />
          }
        >
          <Text style={{ fontSize: 16, color: '#ef4444', textAlign: 'center' }}>
            Failed to load notifications. Pull to retry.
          </Text>
        </ScrollView>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
            No notifications
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem item={item} />}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl onRefresh={refetch} refreshing={isLoading} tintColor="#b6ec13" />
          }
        />
      )}
    </View>
  );
}
