import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AddEditShiftBottomSheet } from '@/features/schedule/components/AddEditShiftBottomSheet';
import type { ShiftEditConfig, ShiftConfirmResult } from '@/features/schedule/components/AddEditShiftBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addWeeks, getDay } from 'date-fns';
import { WeekNavigator } from '@/features/schedule/components/WeekNavigator';
import { DaySelector } from '@/features/schedule/components/DaySelector';
import { EmployeeShiftRow } from '@/features/schedule/components/EmployeeShiftRow';
import { ScheduleOptionsMenu } from '@/features/schedule/components/ScheduleOptionsMenu';
import { LeaveScheduleSheet } from '@/features/schedule/components/LeaveScheduleSheet';
import { RenameScheduleSheet } from '@/features/schedule/components/RenameScheduleSheet';
import { ViewMembersSheet } from '@/features/schedule/components/ViewMembersSheet';
import { ShiftDetailBottomSheet } from '@/features/schedule/components/ShiftDetailBottomSheet';
import { PageHeader } from '@/components/PageHeader';
import { useScheduleStore } from '@/stores/scheduleStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import type { Shift } from '@/types/schedule';

function toWeekIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  // Auth
  const { userId, userRole } = useAuthStore();
  const isManager = userRole === 'Manager';

  // Schedule store
  const scheduleItem = useScheduleStore((s) => s.schedules.find((sc) => sc.id === id));
  const employees = useScheduleStore((s) => s.employeesBySchedule[id as string] ?? []);
  const shifts = useScheduleStore((s) => s.shiftsBySchedule[id as string] ?? []);
  const { removeSchedule, addShiftToSchedule, updateShiftInSchedule, deleteShiftFromSchedule } =
    useScheduleStore();

  const inviteCode = scheduleItem?.inviteCode;

  // Week navigation
  const baseWeekStart = useMemo(() => {
    const stored = scheduleItem?.startWeek;
    return stored ? new Date(stored) : new Date();
  }, [scheduleItem?.startWeek]);

  const today = new Date();
  const todayIndex = toWeekIndex(getDay(today));

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [viewMembersVisible, setViewMembersVisible] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [shiftDetailVisible, setShiftDetailVisible] = useState(false);
  const [addEditConfig, setAddEditConfig] = useState<ShiftEditConfig | null>(null);
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);

  const currentWeekStart = useMemo(
    () => addWeeks(baseWeekStart, weekOffset),
    [baseWeekStart, weekOffset],
  );

  const isFullCollab = (scheduleItem?.memberPermission ?? 'manager_only') === 'full_collaboration';
  const canEditShifts = isManager || isFullCollab;

  const shiftsForDay = useMemo(
    () => shifts.filter((s) => s.dayOfWeek === selectedDayIndex),
    [shifts, selectedDayIndex],
  );

  function getEmployeeShifts(employeeId: string) {
    return shiftsForDay.filter((s) => s.employeeId === employeeId);
  }

  function handleAddShift(employeeId: string) {
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return;
    setAddEditConfig({ mode: 'add', employeeId, dayOfWeek: selectedDayIndex, employee });
    setAddEditVisible(true);
  }

  function handleShiftPress(shift: Shift) {
    setSelectedShift(shift);
    setShiftDetailVisible(true);
  }

  function handleEditShift(shift: Shift) {
    const employee = employees.find((e) => e.id === shift.employeeId);
    if (!employee) return;
    setShiftDetailVisible(false);
    setTimeout(() => {
      setAddEditConfig({ mode: 'edit', shift, employee });
      setAddEditVisible(true);
    }, 160);
  }

  function handleDeleteShift(shift: Shift) {
    deleteShiftFromSchedule(id as string, shift.id);
    setShiftDetailVisible(false);
  }

  function handleShiftConfirm(result: ShiftConfirmResult) {
    const newShift: Shift =
      result.mode === 'edit' && result.shiftId
        ? {
            ...shifts.find((s) => s.id === result.shiftId)!,
            startTime: result.startTime,
            endTime: result.endTime,
          }
        : {
            id: `shift-${Date.now()}`,
            employeeId: result.employeeId,
            dayOfWeek: result.dayOfWeek,
            startTime: result.startTime,
            endTime: result.endTime,
            shiftType: 'Custom' as const,
          };

    if (result.mode === 'edit' && result.shiftId) {
      updateShiftInSchedule(id as string, newShift, result.shiftId);
    } else {
      addShiftToSchedule(id as string, newShift);
    }
    setAddEditVisible(false);
  }

  const headerContentHeight = 40 + 16 + 38 + 16 + 44 + 8;
  const headerHeight = insets.top + 16 + headerContentHeight;

  if (!scheduleItem) {
    return (
      <View className="flex-1 bg-[#f8f8f6] items-center justify-center">
        <Text className="text-[#64748b]">Schedule not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f8f8f6]">
      {/* Sticky Header */}
      <View
        className="absolute top-0 left-0 right-0 z-10 px-6 gap-4 pb-2 bg-[rgba(248,248,246,0.95)]"
        style={{ paddingTop: insets.top + 16 }}
      >
        {/* Title row */}
        <PageHeader
          title={scheduleItem.title}
          subtitle={scheduleItem.subtitle}
          onBack={() => router.back()}
          rightElement={
            <TouchableOpacity
              onPress={() => setMenuOpen(true)}
              activeOpacity={0.7}
              className="size-10 rounded-full bg-white items-center justify-center border border-[#f1f5f9]"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="#0f172a" />
            </TouchableOpacity>
          }
        />

        {/* Week navigator */}
        <WeekNavigator
          weekStartDate={currentWeekStart}
          onPrevWeek={() => setWeekOffset((o) => o - 1)}
          onNextWeek={() => setWeekOffset((o) => o + 1)}
          onAddNextWeek={() => setWeekOffset((o) => o + 1)}
          isManager={isManager}
        />

        {/* Day selector */}
        <DaySelector
          weekStartDate={currentWeekStart}
          selectedDayIndex={selectedDayIndex}
          onSelectDay={setSelectedDayIndex}
        />
      </View>

      <ScheduleOptionsMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLeave={() => {
          setTimeout(() => setLeaveConfirmVisible(true), 160);
        }}
        onViewMembers={() => {
          setTimeout(() => setViewMembersVisible(true), 160);
        }}
        inviteCode={inviteCode}
        onInviteCopied={() => showToast('Invite code copied!', 'success')}
        isManager={isManager}
        onRename={() => setTimeout(() => setRenameVisible(true), 160)}
      />

      <ViewMembersSheet
        visible={viewMembersVisible}
        onClose={() => setViewMembersVisible(false)}
        employees={employees}
        isManager={isManager}
      />

      <LeaveScheduleSheet
        visible={leaveConfirmVisible}
        scheduleName={scheduleItem.title}
        onClose={() => setLeaveConfirmVisible(false)}
        onConfirm={() => {
          setLeaveConfirmVisible(false);
          // TODO: call leave API
          removeSchedule(id as string);
          showToast('You have left the schedule', 'success');
          router.back();
        }}
      />

      <RenameScheduleSheet
        visible={renameVisible}
        onClose={() => setRenameVisible(false)}
        currentName={scheduleItem.title}
        onConfirm={(_newName) => {
          // TODO: call POST /api/schedules/{id}/rename
          showToast('Schedule renamed', 'success');
        }}
      />

      <ShiftDetailBottomSheet
        visible={shiftDetailVisible}
        shift={selectedShift}
        employee={
          selectedShift
            ? employees.find((e) => e.id === selectedShift.employeeId) ?? null
            : null
        }
        weekStartDate={currentWeekStart.toISOString()}
        canEdit={canEditShifts || selectedShift?.employeeId === userId}
        onClose={() => setShiftDetailVisible(false)}
        onEditShift={handleEditShift}
        onDeleteShift={handleDeleteShift}
      />

      <AddEditShiftBottomSheet
        visible={addEditVisible}
        config={addEditConfig}
        weekStartDate={currentWeekStart.toISOString()}
        onClose={() => setAddEditVisible(false)}
        onConfirm={handleShiftConfirm}
      />

      {/* Scrollable employee list */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingHorizontal: 16,
          paddingBottom: 96,
          gap: 24,
        }}
      >
        {employees.map((employee) => (
          <EmployeeShiftRow
            key={employee.id}
            employee={employee}
            shifts={getEmployeeShifts(employee.id)}
            canEditShifts={canEditShifts}
            currentUserId={userId}
            onAddShift={handleAddShift}
            onShiftPress={handleShiftPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}
