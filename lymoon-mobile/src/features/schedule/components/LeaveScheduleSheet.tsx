import { ConfirmActionSheet } from '@/components/ConfirmActionSheet';

type Props = {
  visible: boolean;
  scheduleName: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function LeaveScheduleSheet({ visible, scheduleName, onClose, onConfirm }: Props) {
  return (
    <ConfirmActionSheet
      visible={visible}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Leave Schedule?"
      message={`You'll lose access to "${scheduleName}" and its shifts. You can rejoin using the invite code.`}
      confirmLabel="Leave"
      iconName="warning-outline"
      iconColor="#f59e0b"
      iconBg="rgba(245,158,11,0.12)"
    />
  );
}
