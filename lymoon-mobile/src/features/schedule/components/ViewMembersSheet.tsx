import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfWeek, subWeeks, addDays } from 'date-fns';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmActionSheet } from '@/components/ConfirmActionSheet';
import { OptionsMenuCard } from '@/components/OptionsMenuCard';
import { UserAvatar } from '@/components/UserAvatar';
import { useScheduleMembers, useWorkHours, useRemoveMember } from '@/lib/queries/schedules';
import { useAuthStore } from '@/stores/authStore';
import type { Employee } from '@/types/schedule';
import { sortEmployees } from '@/features/schedule/utils/sortEmployees';

type Props = {
  visible: boolean;
  onClose: () => void;
  scheduleId: string;
  isManager: boolean;
  currentUserId: string;
  onRemoveSuccess?: () => void;
  onRemoveError?: (msg: string) => void;
};

// ─── Week helpers ────────────────────────────────────────────────────────────

type WeekRange = { start: Date; end: Date; isCurrent: boolean };

function computeWeekRanges(): WeekRange[] {
  const now = new Date();
  const currentMonday = startOfWeek(now, { weekStartsOn: 1 });
  return [0, 1, 2, 3].map((offset) => {
    const start = subWeeks(currentMonday, offset);
    const end = addDays(start, 6);
    return { start, end, isCurrent: offset === 0 };
  });
}

function formatWeekLabel(start: Date, end: Date, isCurrent: boolean): string {
  const range = `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
  return isCurrent ? `${range} (Current Week)` : range;
}

// ─── WorkHoursView ───────────────────────────────────────────────────────────

type WorkHoursViewProps = {
  employee: Employee;
  scheduleId: string;
  onBack: () => void;
};

function WorkHoursView({ employee, scheduleId, onBack }: WorkHoursViewProps) {
  const weeks = computeWeekRanges();
  const { data: workHours = [], isLoading } = useWorkHours(scheduleId, employee.id);

  // Map API work hours (keyed by weekStart) onto the computed week ranges
  const weekData = weeks.map((week) => {
    const isoStart = format(week.start, 'yyyy-MM-dd');
    const match = workHours.find((wh) => wh.weekStart.slice(0, 10) === isoStart);
    return {
      label: formatWeekLabel(week.start, week.end, week.isCurrent),
      hours: match?.totalHours ?? 0,
      isCurrent: week.isCurrent,
    };
  });

  const maxHours = Math.max(...weekData.map((w) => w.hours), 1);

  return (
    <View className="h-[456px]">
      {/* Header */}
      <View className="h-16 flex-row items-center px-4 border-b border-slate-100 bg-white">
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-8 h-8 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text
          className="flex-1 pl-3"
          style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: -0.45 }}
          numberOfLines={1}
        >
          {employee.name}
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#b6ec13" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
        >
          {/* Section heading + badge */}
          <View className="flex-row items-center justify-between mb-8">
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: -0.45 }}>
              Work Hours History
            </Text>
            <View
              className="px-3 py-1 rounded-full border border-[#b6ec13]"
              style={{ backgroundColor: 'rgba(182,236,19,0.1)' }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#0f172a',
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                }}
              >
                Last 30 Days
              </Text>
            </View>
          </View>

          {/* Bar chart rows */}
          <View style={{ gap: 40 }}>
            {weekData.map((week) => (
              <View key={week.label} style={{ gap: 8 }}>
                {/* Label row */}
                <View className="flex-row items-center justify-between">
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: '#475569' }}
                    numberOfLines={1}
                    className="flex-1 pr-4"
                  >
                    {week.label}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                    {`${week.hours}h`}
                  </Text>
                </View>
                {/* Progress bar */}
                <View className="h-3 bg-slate-100 rounded-full w-full overflow-hidden">
                  <View
                    className="h-full bg-[#b6ec13] rounded-full"
                    style={{ width: `${(week.hours / maxHours) * 100}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── MemberCard ──────────────────────────────────────────────────────────────

type MenuState = { employee: Employee; top: number } | null;

type MemberCardProps = {
  employee: Employee;
  containerRef: React.RefObject<View | null>;
  onMenuPress: (employee: Employee, top: number) => void;
  currentUserId: string;
  currentUserName: string | null;
};

function MemberCard({ employee, containerRef, onMenuPress, currentUserId, currentUserName }: MemberCardProps) {
  const buttonRef = useRef<View>(null);
  const isOwnerManager = employee.role === 'Manager';

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
        <UserAvatar
          name={employee.id === currentUserId ? currentUserName : employee.name}
          initials={employee.avatarInitials}
          size={40}
        />
        <View className="flex-row items-center gap-2">
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
            {employee.name}
          </Text>
          {isOwnerManager && (
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
        ref={buttonRef}
        onPress={handleMenuPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="w-8 h-8 rounded-full items-center justify-center"
      >
        <Ionicons name="ellipsis-vertical" size={16} color="#0f172a" />
      </TouchableOpacity>
    </View>
  );
}

// ─── ViewMembersSheet ────────────────────────────────────────────────────────

export function ViewMembersSheet({ visible, onClose, scheduleId, isManager, currentUserId, onRemoveSuccess, onRemoveError }: Props) {
  const { userName } = useAuthStore();
  const [menuState, setMenuState] = useState<MenuState>(null);
  const [removeTarget, setRemoveTarget] = useState<Employee | null>(null);
  const [workHoursEmployee, setWorkHoursEmployee] = useState<Employee | null>(null);
  const containerRef = useRef<View>(null);

  const { data: members = [], isLoading: membersLoading, isError: membersError } = useScheduleMembers(scheduleId);
  const removeMember = useRemoveMember(scheduleId);

  // Convert API member shape to Employee type, then sort:
  //   1. Current user  2. Managers (A–Z)  3. Members (A–Z)
  const employees: Employee[] = sortEmployees(
    members.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.scheduleRole,
      avatarInitials: m.avatarInitials,
    })),
    currentUserId,
  );

  useEffect(() => {
    if (!visible) {
      setMenuState(null);
      setWorkHoursEmployee(null);
    }
  }, [visible]);

  function closeMenu() {
    setMenuState(null);
  }

  function handleRemovePress(employee: Employee) {
    closeMenu();
    setRemoveTarget(employee);
  }

  function handleRemoveConfirm() {
    if (!removeTarget) return;
    const targetId = removeTarget.id;
    setRemoveTarget(null);
    removeMember.mutate(targetId, {
      onSuccess: () => onRemoveSuccess?.(),
      onError: (err: Error) => {
        const msg =
          err.message === 'sole_manager'
            ? 'Cannot remove the only manager of this schedule.'
            : err.message === 'not_a_member'
              ? 'This user is no longer a member of this schedule.'
              : err.message || 'Failed to remove member.';
        onRemoveError?.(msg);
      },
    });
  }

  return (
    <>
      <BottomSheet
        visible={visible}
        onClose={onClose}
        height={480}
        backgroundColor="#ffffff"
      >
        {workHoursEmployee ? (
          <WorkHoursView
            employee={workHoursEmployee}
            scheduleId={scheduleId}
            onBack={() => setWorkHoursEmployee(null)}
          />
        ) : (
          <View ref={containerRef} className="h-[456px]">
            {membersLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="small" color="#b6ec13" />
              </View>
            ) : membersError ? (
              <View className="flex-1 items-center justify-center px-6">
                <Text style={{ fontSize: 14, color: '#ef4444', textAlign: 'center' }}>
                  Failed to load members.
                </Text>
              </View>
            ) : employees.length === 0 ? (
              <View className="flex-1 items-center justify-center px-6">
                <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
                  No members found.
                </Text>
              </View>
            ) : (
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
                    currentUserId={currentUserId}
                    currentUserName={userName}
                  />
                ))}
              </ScrollView>
            )}

            {menuState && (
              <>
                <Pressable
                  className="absolute inset-0"
                  onPress={closeMenu}
                />
                <OptionsMenuCard
                  iconSize={15}
                  style={{ position: 'absolute', right: 12, top: menuState.top, width: 192, zIndex: 100 }}
                  items={[
                    {
                      key: 'view-work-hours',
                      label: 'View Work Hours',
                      icon: 'time-outline',
                      onPress: () => {
                        closeMenu();
                        setWorkHoursEmployee(menuState.employee);
                      },
                    },
                  ]}
                  destructiveItem={isManager && menuState.employee.id !== currentUserId ? {
                    key: 'remove',
                    label: 'Remove',
                    icon: 'person-remove-outline',
                    color: '#ba1a1a',
                    onPress: () => handleRemovePress(menuState.employee),
                    disabled: removeMember.isPending,
                  } : undefined}
                />
              </>
            )}
          </View>
        )}
      </BottomSheet>

      <ConfirmActionSheet
        visible={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveConfirm}
        title="Remove Member?"
        message={`${removeTarget?.name} will be removed from this schedule and lose access to all shifts.`}
        confirmLabel="Remove"
        iconName="person-remove-outline"
        iconColor="#dc2626"
        iconBg="rgba(220,38,38,0.10)"
      />
    </>
  );
}
