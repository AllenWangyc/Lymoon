import { Modal, View, Text, Pressable, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onClose: () => void;
  onLeave: () => void;
  onViewMembers: () => void;
};

type MenuItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color?: string;
  onPress: () => void;
};

export function ScheduleOptionsMenu({ visible, onClose, onLeave, onViewMembers }: Props) {
  const insets = useSafeAreaInsets();

  const menuTop = insets.top + 56;

  const items: MenuItem[] = [
    {
      key: 'view-members',
      label: 'View Members',
      icon: 'people-outline',
      onPress: () => {
        onClose();
        onViewMembers();
      },
    },
    {
      key: 'copy-invite',
      label: 'Copy Invite Link',
      icon: 'link-outline',
      onPress: () => {
        // TODO: copy invite code to clipboard
        onClose();
      },
    },
    {
      key: 'rename',
      label: 'Rename',
      icon: 'pencil-outline',
      onPress: () => {
        // TODO: show rename dialog
        onClose();
      },
    },
  ];

  const destructiveItem: MenuItem = {
    key: 'leave',
    label: 'Leave Schedule',
    icon: 'exit-outline',
    color: '#dc2626',
    onPress: () => {
      onClose();
      onLeave();
    },
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Full-screen backdrop — tap anywhere to close */}
      <Pressable className="flex-1" onPress={onClose}>
        {/* Menu card — stop propagation so tapping inside doesn't close */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="absolute w-[224px] bg-white rounded-[12px] border border-[#e2e8f0]"
          style={{
            top: menuTop,
            right: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <View className="py-[9px] px-px">
            {items.map((item) => (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.7}
                onPress={item.onPress}
                className="flex-row items-center gap-3 px-4 py-3"
              >
                <Ionicons name={item.icon} size={18} color={item.color ?? '#0f172a'} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: item.color ?? '#0f172a' }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Divider */}
            <View className="h-px bg-[#f1f5f9] mx-px" />

            <TouchableOpacity
              key={destructiveItem.key}
              activeOpacity={0.7}
              onPress={destructiveItem.onPress}
              className="flex-row items-center gap-3 px-4 py-3"
            >
              <Ionicons name={destructiveItem.icon} size={18} color={destructiveItem.color} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: destructiveItem.color }}>
                {destructiveItem.label}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
