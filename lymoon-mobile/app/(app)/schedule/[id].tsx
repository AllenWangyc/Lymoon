import { useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AddEditShiftBottomSheet } from '@/features/schedule/components/AddEditShiftBottomSheet';
import type { ShiftEditConfig, ShiftConfirmResult } from '@/features/schedule/components/AddEditShiftBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addWeeks, getDay, format } from 'date-fns';
import { WeekNavigator } from '@/features/schedule/components/WeekNavigator';
import { DaySelector } from '@/features/schedule/components/DaySelector';
import { EmployeeShiftRow } from '@/features/schedule/components/EmployeeShiftRow';
import { ScheduleOptionsMenu } from '@/features/schedule/components/ScheduleOptionsMenu';
import { LeaveScheduleSheet } from '@/features/schedule/components/LeaveScheduleSheet';
import { RenameScheduleSheet } from '@/features/schedule/components/RenameScheduleSheet';
import { ViewMembersSheet } from '@/features/schedule/components/ViewMembersSheet';
import { ShiftDetailBottomSheet } from '@/features/schedule/components/ShiftDetailBottomSheet';
import { PageHeader } from '@/components/PageHeader';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import {
  useScheduleDetail,
  useRenameSchedule,
  useLeaveSchedule,
  useAddNextWeek,
} from '@/lib/queries/schedules';
import { useAddShift, useUpdateShift, useDeleteShift } from '@/lib/queries/shifts';
import type { Shift } from '@/types/schedule';

function toWeekIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const userId = useAuthStore((s) => s.userId!);

  const today = useRef(new Date()).current;
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

  // Derive the Monday for the currently viewed week
  const currentWeekStart = useMemo(() => {
    const monday = new Date(today);
    // Align to Monday of the current week first
    const dayOfWeek = monday.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(monday.getDate() + diff);
    return addWeeks(monday, weekOffset);
  }, [weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps

  const weekStartParam = format(currentWeekStart, 'yyyy-MM-dd');

  // ─── Server state ─────────────────────────────────────────────────────────
  const {
    data: scheduleDetail,
    isLoading,
    isError,
    refetch,
  } = useScheduleDetail(id as string, weekStartParam);

  const renameMutation = useRenameSchedule(id as string);
  const leaveMutation = useLeaveSchedule(id as string);
  const addNextWeekMutation = useAddNextWeek(id as string);
  const addShift = useAddShift(id as string);
  const updateShift = useUpdateShift(id as string);
  const deleteShift = useDeleteShift(id as string);

  // ─── Derived values ───────────────────────────────────────────────────────
  const isManager = scheduleDetail?.currentUserRole === 'Manager';
  const isFullCollab =
    (scheduleDetail?.memberPermission ?? 'manager_only') === 'full_collaboration';
  const canEditShifts = isManager || isFullCollab;
  const isAtLatestWeek = scheduleDetail?.currentWeek
    ? weekStartParam >= scheduleDetail.currentWeek
    : false;

  const employees = scheduleDetail?.employees ?? [];
  const shifts = scheduleDetail?.shifts ?? [];

  const shiftsForDay = useMemo(
    () => shifts.filter((s) => s.dayOfWeek === selectedDayIndex),
    [shifts, selectedDayIndex],
  );

  function getEmployeeShifts(employeeId: string) {
    return shiftsForDay.filter((s) => s.employeeId === employeeId);
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

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
    setShiftDetailVisible(false);
    deleteShift.mutate(shift.id, {
      onSuccess: () => showToast('Shift deleted', 'success'),
      onError: (err) => showToast(err.message ?? 'Failed to delete shift', 'error'),
    });
  }

  function handleShiftConfirm(result: ShiftConfirmResult) {
    if (result.mode === 'add') {
      addShift.mutate(
        {
          employeeId: result.employeeId,
          dayOfWeek: result.dayOfWeek,
          startTime: result.startTime,
          endTime: result.endTime,
          shiftType: result.shiftType,
        },
        {
          onSuccess: () => {
            setAddEditVisible(false);
            showToast('Shift added', 'success');
          },
          onError: (err) => showToast(err.message ?? 'Failed to add shift', 'error'),
        },
      );
    } else {
      if (!result.shiftId) return;
      updateShift.mutate(
        {
          shiftId: result.shiftId,
          startTime: result.startTime,
          endTime: result.endTime,
          shiftType: result.shiftType,
        },
        {
          onSuccess: () => {
            setAddEditVisible(false);
            showToast('Shift updated', 'success');
          },
          onError: (err) => showToast(err.message ?? 'Failed to update shift', 'error'),
        },
      );
    }
  }

  function handleAddNextWeek() {
    addNextWeekMutation.mutate(undefined, {
      onSuccess: () => {
        setWeekOffset((o) => o + 1);
        showToast('Next week added', 'success');
      },
      onError: () => {
        showToast('Failed to add next week', 'error');
      },
    });
  }

  function handleRenameConfirm(newName: string) {
    renameMutation.mutate(newName, {
      onSuccess: () => showToast('Schedule renamed', 'success'),
      onError: () => showToast('Failed to rename schedule', 'error'),
    });
  }

  function handleLeaveConfirm() {
    setLeaveConfirmVisible(false);
    leaveMutation.mutate(undefined, {
      onSuccess: () => {
        showToast('You have left the schedule', 'success');
        router.back();
      },
      onError: (err) => {
        const msg =
          err.message === 'sole_manager'
            ? 'You are the only manager. Assign another manager before leaving.'
            : 'Failed to leave schedule.';
        showToast(msg, 'error');
      },
    });
  }

  const headerContentHeight = 40 + 16 + 38 + 16 + 44 + 8;
  const headerHeight = insets.top + 16 + headerContentHeight;

  // ─── Loading / error states ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 bg-[#f8f8f6] items-center justify-center">
        <ActivityIndicator size="large" color="#b6ec13" />
      </View>
    );
  }

  if (isError || !scheduleDetail) {
    return (
      <View className="flex-1 bg-[#f8f8f6] items-center justify-center gap-4 px-6">
        <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center' }}>
          Failed to load schedule. Please try again.
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          activeOpacity={0.8}
          className="bg-[#b6ec13] px-6 h-11 rounded-2xl items-center justify-center"
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-[#f8f8f6]">
      {/* Sticky Header */}
      <View
        className="absolute top-0 left-0 right-0 z-10 px-6 gap-4 pb-2 bg-[rgba(248,248,246,0.95)]"
        style={{ paddingTop: insets.top + 16 }}
      >
        {/* Title row */}
        <PageHeader
          title={scheduleDetail.title}
          subtitle={scheduleDetail.subtitle}
          onBack={() => router.back()}
          rightElement={
            <TouchableOpacity
              onPress={() => setMenuOpen(true)}
              activeOpacity={0.7}
              className="size-10 rounded-full bg-white items-center justify-center border border-[#f1f5f9]"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
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
          isAtLatestWeek={isAtLatestWeek}
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
        inviteCode={scheduleDetail.inviteCode}
        onInviteCopied={() => showToast('Invite code copied!', 'success')}
        isManager={isManager}
        onRename={() => setTimeout(() => setRenameVisible(true), 160)}
        onAddNextWeek={handleAddNextWeek}
      />

      <ViewMembersSheet
        visible={viewMembersVisible}
        onClose={() => setViewMembersVisible(false)}
        scheduleId={id as string}
        isManager={isManager}
        currentUserId={userId}
        onRemoveSuccess={() => showToast('Member removed', 'success')}
        onRemoveError={(msg) => showToast(msg, 'error')}
      />

      <LeaveScheduleSheet
        visible={leaveConfirmVisible}
        scheduleName={scheduleDetail.title}
        onClose={() => setLeaveConfirmVisible(false)}
        onConfirm={handleLeaveConfirm}
      />

      <RenameScheduleSheet
        visible={renameVisible}
        onClose={() => setRenameVisible(false)}
        currentName={scheduleDetail.title}
        onConfirm={handleRenameConfirm}
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
        isPending={deleteShift.isPending}
        onClose={() => setShiftDetailVisible(false)}
        onEditShift={handleEditShift}
        onDeleteShift={handleDeleteShift}
      />

      <AddEditShiftBottomSheet
        visible={addEditVisible}
        config={addEditConfig}
        weekStartDate={currentWeekStart.toISOString()}
        isPending={addShift.isPending || updateShift.isPending}
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
        {employees.length === 0 ? (
          <View className="items-center justify-center pt-12">
            <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
              No members in this schedule yet.
            </Text>
          </View>
        ) : (
          employees.map((employee) => (
            <EmployeeShiftRow
              key={employee.id}
              employee={employee}
              shifts={getEmployeeShifts(employee.id)}
              canEditShifts={canEditShifts}
              currentUserId={userId}
              onAddShift={handleAddShift}
              onShiftPress={handleShiftPress}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
