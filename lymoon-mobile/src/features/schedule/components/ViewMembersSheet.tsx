import { View, Text, ScrollView } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import type { Employee } from '@/types/schedule';

type Props = {
  visible: boolean;
  onClose: () => void;
  employees: Employee[];
};

const AVATAR_COLORS = ['#b6ec13', '#86efac', '#93c5fd', '#fca5a5', '#fcd34d', '#c4b5fd'];

function getAvatarColor(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function MemberCard({ employee }: { employee: Employee }) {
  const isManager = employee.role === 'Manager';

  return (
    <View
      className="bg-white rounded-[16px] p-[13px] flex-row items-center"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      {/* Avatar */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{
          backgroundColor: getAvatarColor(employee.name),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
          {employee.avatarInitials}
        </Text>
      </View>

      {/* Name + badge */}
      <View className="ml-4 flex-row items-center gap-2">
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
          {employee.name}
        </Text>
        {isManager && (
          <View className="bg-[#b6ec13] px-[10px] py-[2px] rounded-full">
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Manager
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function ViewMembersSheet({ visible, onClose, employees }: Props) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={480}
      backgroundColor="#ffffff"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 12 }}
      >
        {employees.map((emp) => (
          <MemberCard key={emp.id} employee={emp} />
        ))}
      </ScrollView>
    </BottomSheet>
  );
}
