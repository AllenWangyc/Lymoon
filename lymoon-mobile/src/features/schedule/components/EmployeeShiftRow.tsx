import { View, Text, ScrollView } from 'react-native';
import type { Employee, Shift } from '@/types/schedule';
import { ShiftCard } from './ShiftCard';
import { AddShiftSlot } from './AddShiftSlot';

type Props = {
  employee: Employee;
  shifts: Shift[];
  canEditShifts: boolean;
  currentUserId: string;
  onAddShift: (employeeId: string) => void;
  onShiftPress: (shift: Shift) => void;
};

export function EmployeeShiftRow({
  employee,
  shifts,
  canEditShifts,
  currentUserId,
  onAddShift,
  onShiftPress,
}: Props) {
  const canAddShift = canEditShifts || employee.id === currentUserId;

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <View
          className="size-9 rounded-full items-center justify-center bg-[#e2e8f0] border-2 border-white"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
            {employee.avatarInitials}
          </Text>
        </View>

        <View className="gap-[2px]">
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', lineHeight: 20 }}>
            {employee.name}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '500', color: '#94a3b8', lineHeight: 15 }}>
            {employee.role}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        className="h-[65px]"
      >
        {shifts.map((shift) => (
          <ShiftCard key={shift.id} shift={shift} onPress={() => onShiftPress(shift)} />
        ))}
        {canAddShift && (
          <AddShiftSlot onPress={() => onAddShift(employee.id)} />
        )}
      </ScrollView>
    </View>
  );
}
