// app/(app)/notifications/index.tsx
import { View, Text, SectionList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow, isToday, isYesterday, differenceInCalendarDays } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNotifications, useMarkNotificationsRead, type Notification } from '@/lib/queries/notifications';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/PageHeader';

type NotificationSection = { title: string; data: Notification[] };


function groupNotificationsByPeriod(notifications: Notification[]): NotificationSection[] {
  const sections: NotificationSection[] = [
    { title: 'TODAY', data: [] },
    { title: 'YESTERDAY', data: [] },
    { title: 'THIS WEEK', data: [] },
    { title: 'EARLIER', data: [] },
  ];

  for (const n of notifications) {
    const date = new Date(n.createdAt);
    if (isToday(date)) {
      sections[0].data.push(n);
    } else if (isYesterday(date)) {
      sections[1].data.push(n);
    } else {
      const diff = differenceInCalendarDays(new Date(), date);
      if (diff <= 6) {
        sections[2].data.push(n);
      } else {
        sections[3].data.push(n);
      }
    }
  }

  return sections.filter((s) => s.data.length > 0);
}

const TYPE_LABELS: Record<string, string> = {
  shift_modified: 'Shift Modified',
  shift_deleted: 'Shift Deleted',
  new_week_added: 'New Week Added',
  removed_from_schedule: 'Removed from Schedule',
  shift_added: 'Shift Added',
  member_joined: 'New Member',
  schedule_updated: 'Schedule Updated',
};

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  shift_modified: 'create-outline',
  shift_deleted: 'trash-outline',
  new_week_added: 'calendar-outline',
  removed_from_schedule: 'person-remove-outline',
  shift_added: 'add-circle-outline',
  member_joined: 'person-add-outline',
  schedule_updated: 'refresh-outline',
};

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
};

function formatRelativeTime(createdAt: string): string {
  try {
    const result = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    return result.charAt(0).toUpperCase() + result.slice(1);
  } catch {
    return '';
  }
}

function NotificationCard({ item }: { item: Notification }) {
  const typeLabel = TYPE_LABELS[item.type] ?? item.type;
  const iconName = TYPE_ICONS[item.type] ?? 'notifications-outline';

  return (
    <View
      className="flex-row items-start rounded-[14px] mb-3 p-4"
      style={[
        item.isRead
          ? { backgroundColor: 'rgba(255,255,255,0.6)' }
          : { backgroundColor: '#ffffff', ...cardShadow },
      ]}
    >
      {/* Icon container */}
      <View
        className="items-center justify-center mr-3.5 flex-shrink-0 w-12 h-12 rounded-xl overflow-visible"
        style={{ backgroundColor: item.isRead ? '#f1f5f9' : 'rgba(182,236,19,0.2)' }}
      >
        <Ionicons
          name={iconName}
          size={22}
          color={item.isRead ? '#94a3b8' : '#4e6704'}
        />
        {/* Unread dot */}
        {!item.isRead && (
          <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#b6ec13]" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: item.isRead ? '#94a3b8' : '#64748b',
            }}
            numberOfLines={1}
          >
            {typeLabel}
          </Text>
          <Text className="ml-2" style={{ fontSize: 12, color: '#94a3b8' }}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 14,
            lineHeight: 20,
            color: item.isRead ? '#64748b' : '#0f172a',
          }}
        >
          {item.message}
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2 }}
      className="mt-5 mb-2 px-1"
    >
      {title}
    </Text>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications = [], isLoading, isFetching, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function handleClearAll() {
    const allIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (allIds.length === 0) return;
    markRead.mutate(allIds, {
      onError: () => showToast('Failed to clear notifications'),
    });
  }

  const sections = groupNotificationsByPeriod(notifications);

  return (
    <View className="flex-1 bg-[#f8f8f6]">
      {/* Header */}
      <View
        className="px-4 pb-3 bg-[#f8f8f6]"
        style={{ paddingTop: insets.top + 12 }}
      >
        <PageHeader
          title="Notifications"
          onBack={() => router.back()}
          rightElement={
            <TouchableOpacity
              onPress={handleClearAll}
              activeOpacity={0.7}
              disabled={markRead.isPending}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: unreadCount > 0 && !markRead.isPending ? '#b6ec13' : '#94a3b8',
                }}
              >
                Clear All
              </Text>
            </TouchableOpacity>
          }
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#b6ec13" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center" style={{ fontSize: 16, color: '#ef4444' }}>
            Failed to load notifications.
          </Text>
          <TouchableOpacity onPress={() => refetch()} activeOpacity={0.7} className="mt-4">
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#b6ec13' }}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="notifications-off-outline" size={48} color="#94a3b8" />
          <Text
            className="text-center mt-3"
            style={{ fontSize: 16, color: '#94a3b8' }}
          >
            You're all caught up
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationCard item={item} />}
          renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl onRefresh={refetch} refreshing={isFetching} tintColor="#b6ec13" />
          }
        />
      )}
    </View>
  );
}
