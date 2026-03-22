import { Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OptionsMenuCard } from '@/components/OptionsMenuCard';
import type { OptionsMenuItem } from '@/components/OptionsMenuCard';

type Props = {
  visible: boolean;
  onClose: () => void;
  onLeave: () => void;
  onViewMembers: () => void;
};

export function ScheduleOptionsMenu({ visible, onClose, onLeave, onViewMembers }: Props) {
  const insets = useSafeAreaInsets();

  const menuTop = insets.top + 56;

  const items: OptionsMenuItem[] = [
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

  const destructiveItem: OptionsMenuItem = {
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
        <Pressable onPress={(e) => e.stopPropagation()}>
          <OptionsMenuCard
            items={items}
            destructiveItem={destructiveItem}
            iconSize={18}
            style={{
              position: 'absolute',
              top: menuTop,
              right: 24,
              width: 224,
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
