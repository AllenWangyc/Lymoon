import { View, Text, ScrollView } from 'react-native';
import type { Employee, Shift } from '@/types/schedule';
import { ShiftCard } from './ShiftCard';
import { AddShiftSlot } from './AddShiftSlot';

type Props = {
  employee: Employee;
  shifts: Shift[];
  isManager: boolean;
  currentUserId: string;
  onAddShift: (employeeId: string) => void;
};

export function EmployeeShiftRow({
  employee,
  shifts,
  isManager,
  currentUserId,
  onAddShift,
}: Props) {
  const canAddShift = isManager || employee.id === currentUserId;

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <View
          className="size-9 rounded-full items-center justify-center"
          style={{
            backgroundColor: '#e2e8f0',
            borderWidth: 2,
            borderColor: '#ffffff',
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
        style={{ height: 65 }}
      >
        {shifts.map((shift) => (
          <ShiftCard key={shift.id} shift={shift} />
        ))}
        {canAddShift && (
          <AddShiftSlot onPress={() => onAddShift(employee.id)} />
        )}
      </ScrollView>
    </View>
  );
}
