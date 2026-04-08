import { Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { OptionsMenuCard } from '@/components/OptionsMenuCard';
import type { OptionsMenuItem } from '@/components/OptionsMenuCard';

type Props = {
  visible: boolean;
  onClose: () => void;
  onLeave: () => void;
  onViewMembers: () => void;
  onDissolve?: () => void;
  inviteCode?: string;
  onInviteCopied?: () => void;
  isManager?: boolean;
  onRename?: () => void;
  onAddNextWeek?: () => void;
};

export function ScheduleOptionsMenu({ visible, onClose, onLeave, onViewMembers, onDissolve, inviteCode, onInviteCopied, isManager, onRename, onAddNextWeek }: Props) {
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
    ...(isManager ? [{
      key: 'add-next-week',
      label: 'Add Next Week',
      icon: 'calendar-outline' as const,
      onPress: () => {
        onClose();
        onAddNextWeek?.();
      },
    }] : []),
    {
      key: 'copy-invite',
      label: 'Copy Invite Code',
      icon: 'link-outline',
      onPress: async () => {
        if (inviteCode) {
          await Clipboard.setStringAsync(inviteCode);
          onInviteCopied?.();
        }
        onClose();
      },
    },
    ...(isManager ? [
      {
        key: 'rename',
        label: 'Rename',
        icon: 'pencil-outline' as const,
        onPress: () => {
          onClose();
          onRename?.();
        },
      },
      {
        key: 'leave',
        label: 'Leave Schedule',
        icon: 'exit-outline' as const,
        color: '#dc2626',
        onPress: () => {
          onClose();
          onLeave();
        },
      },
    ] : []),
  ];

  const destructiveItem: OptionsMenuItem = isManager
    ? {
        key: 'dissolve',
        label: 'Dissolve Schedule',
        icon: 'trash-outline',
        color: '#dc2626',
        onPress: () => {
          onClose();
          onDissolve?.();
        },
      }
    : {
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
