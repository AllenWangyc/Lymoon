import { ConfirmActionSheet } from '@/components/ConfirmActionSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  onChooseMember: () => void;
};

export function SoleManagerLeaveSheet({ visible, onClose, onChooseMember }: Props) {
  return (
    <ConfirmActionSheet
      visible={visible}
      onClose={onClose}
      onConfirm={onChooseMember}
      title="Transfer Manager First"
      message="You're the only manager. Assign another manager before leaving."
      confirmLabel="Choose a Member"
      iconName="key-outline"
      iconColor="#f59e0b"
      iconBg="rgba(245,158,11,0.12)"
    />
  );
}
