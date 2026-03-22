import { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/BottomSheet';
import type { Employee } from '@/types/schedule';

type Props = {
  visible: boolean;
  onClose: () => void;
  employees: Employee[];
  onViewWorkHours?: (employee: Employee) => void;
  onRemoveMember?: (employee: Employee) => void;
};

const AVATAR_COLORS = ['#b6ec13', '#86efac', '#93c5fd', '#fca5a5', '#fcd34d', '#c4b5fd'];

function getAvatarColor(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

type MenuState = { employee: Employee; top: number } | null;

type MemberCardProps = {
  employee: Employee;
  containerRef: React.RefObject<View | null>;
  onMenuPress: (employee: Employee, top: number) => void;
};

function MemberCard({ employee, containerRef, onMenuPress }: MemberCardProps) {
  const buttonRef = useRef<View>(null);
  const isManager = employee.role === 'Manager';

  function handleMenuPress() {
    buttonRef.current?.measureInWindow((_bx: number, by: number, _bw: number, bh: number) => {
      containerRef.current?.measureInWindow((_cx: number, cy: number) => {
        onMenuPress(employee, by + bh - cy);
      });
    });
  }

  return (
    <View
      className="bg-white rounded-[16px] p-[13px] flex-row items-center justify-between"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      {/* Avatar + Name + Badge */}
      <View className="flex-row items-center gap-4">
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
        <View className="flex-row items-center gap-2">
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

      {/* Three-dot button */}
      <TouchableOpacity
        ref={buttonRef as any}
        onPress={handleMenuPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="ellipsis-vertical" size={16} color="#0f172a" />
      </TouchableOpacity>
    </View>
  );
}

type OptionsMenuProps = {
  top: number;
  onViewWorkHours: () => void;
  onRemove: () => void;
};

function OptionsMenu({ top, onViewWorkHours, onRemove }: OptionsMenuProps) {
  return (
    <View
      style={{
        position: 'absolute',
        right: 12,
        top,
        width: 192,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(195,201,174,0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 12,
        zIndex: 100,
      }}
    >
      <View style={{ paddingVertical: 9, paddingHorizontal: 1 }}>
        <TouchableOpacity
          onPress={onViewWorkHours}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}
        >
          <Ionicons name="time-outline" size={15} color="#0f172a" />
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#0f172a' }}>View Work Hours</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRemove}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}
        >
          <Ionicons name="person-remove-outline" size={15} color="#ba1a1a" />
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#ba1a1a' }}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ViewMembersSheet({ visible, onClose, employees, onViewWorkHours, onRemoveMember }: Props) {
  const [menuState, setMenuState] = useState<MenuState>(null);
  const containerRef = useRef<View>(null);

  function closeMenu() {
    setMenuState(null);
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      height={480}
      backgroundColor="#ffffff"
    >
      <View ref={containerRef} style={{ height: 456 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={!menuState}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 12 }}
        >
          {employees.map((emp) => (
            <MemberCard
              key={emp.id}
              employee={emp}
              containerRef={containerRef}
              onMenuPress={(employee, top) => setMenuState({ employee, top })}
            />
          ))}
        </ScrollView>

        {menuState && (
          <>
            <Pressable
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              onPress={closeMenu}
            />
            <OptionsMenu
              top={menuState.top}
              onViewWorkHours={() => {
                closeMenu();
                onViewWorkHours?.(menuState.employee);
              }}
              onRemove={() => {
                closeMenu();
                onRemoveMember?.(menuState.employee);
              }}
            />
          </>
        )}
      </View>
    </BottomSheet>
  );
}
