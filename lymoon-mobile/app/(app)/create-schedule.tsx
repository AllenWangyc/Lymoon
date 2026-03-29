import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { startOfWeek, endOfWeek, format, isSameWeek } from 'date-fns';
import { CategoryPicker } from '../../src/features/schedule/components/CategoryPicker';
import { PermissionPicker } from '../../src/features/schedule/components/PermissionPicker';
import { WeekPickerBottomSheet } from '../../src/components/WeekPickerBottomSheet';
import { PageHeader } from '../../src/components/PageHeader';
import { useCreateSchedule } from '@/lib/queries/schedules';
import { useToast } from '@/hooks/useToast';

function formatWeekRange(date: Date): string {
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const isCurrentWeek = isSameWeek(date, new Date(), { weekStartsOn: 1 });
  const range = `${format(date, 'MMM d')} - ${format(end, 'MMM d')}`;
  return isCurrentWeek ? `${range} (This Week)` : range;
}

export default function CreateScheduleScreen() {
  const createSchedule = useCreateSchedule();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<'shift' | 'event' | 'personal'>('shift');
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [memberPermission, setMemberPermission] = useState<
    'manager_only' | 'full_collaboration'
  >('manager_only');
  const [showWeekPicker, setShowWeekPicker] = useState(false);

  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;

  const wordCountColor =
    wordCount <= 17 ? '#94a3b8' : wordCount <= 19 ? '#fb923c' : '#f87171';

  function handleDescriptionChange(text: string): void {
    const newWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (newWordCount > 20) return;
    setDescription(text);
  }

  function handleCreate(): void {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(true);
      return;
    }
    createSchedule.mutate(
      {
        title: trimmedName,
        description: description.trim() || null,
        scheduleType,
        startWeek: format(weekStart, 'yyyy-MM-dd'),
        memberPermission,
        iconBg: 'rgba(182,236,19,0.1)',
      },
      {
        onSuccess: (schedule) => {
          router.replace(
            `/schedule-created?id=${schedule.id}&inviteCode=${schedule.inviteCode}&title=${encodeURIComponent(schedule.title)}`,
          );
        },
        onError: (err) => {
          showToast(err.message ?? 'Failed to create schedule', 'error');
        },
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]">
      {/* Header */}
      <View className="px-4 py-3">
        <PageHeader title="Create Schedule" onBack={() => router.back()} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: 32,
            gap: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Schedule Name */}
          <View>
            <Text
              className="mb-2"
              style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}
            >
              Schedule Name
            </Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (nameError) setNameError(false);
              }}
              placeholder="e.g. Engineering Sprint"
              placeholderTextColor="#94a3b8"
              autoCapitalize="words"
              className="bg-white rounded-2xl h-14 border px-4"
              style={{
                borderColor: nameError ? '#f87171' : 'rgba(182,236,19,0.2)',
                fontSize: 16,
                color: '#0f172a',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            />
            {nameError && (
              <Text
                className="mt-1"
                style={{ fontSize: 12, color: '#f87171' }}
              >
                Schedule name is required
              </Text>
            )}
          </View>

          {/* Description */}
          <View>
            <Text
              className="mb-2"
              style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}
            >
              Description{' '}
              <Text style={{ fontWeight: '400', color: '#94a3b8' }}>(optional)</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={handleDescriptionChange}
              placeholder="What is this schedule for?"
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
              className="bg-white rounded-2xl min-h-[100px] border border-[rgba(182,236,19,0.2)] p-4"
              style={{
                fontSize: 16,
                color: '#0f172a',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            />
            <Text
              className="mt-1 text-right"
              style={{ fontSize: 12, color: wordCountColor }}
            >
              {wordCount} / 20 words
            </Text>
          </View>

          {/* Category */}
          <View>
            <Text
              className="mb-1"
              style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}
            >
              Category
            </Text>
            <View className="mt-1">
              <CategoryPicker value={scheduleType} onChange={setScheduleType} />
            </View>
          </View>

          {/* Start Week */}
          <View>
            <Text
              className="mb-2"
              style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}
            >
              Start Week
            </Text>
            <TouchableOpacity
              onPress={() => setShowWeekPicker(true)}
              activeOpacity={0.8}
              className="bg-white rounded-2xl h-14 border border-[rgba(182,236,19,0.2)] px-4 flex-row items-center justify-between"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar-outline" size={18} color="#0f172a" />
                <Text style={{ fontSize: 16, color: '#0f172a' }}>
                  {formatWeekRange(weekStart)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Member Permissions */}
          <View>
            <Text
              className="mb-1"
              style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}
            >
              Member Permissions
            </Text>
            <View className="mt-1">
              <PermissionPicker value={memberPermission} onChange={setMemberPermission} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Create Button */}
      <View className="pb-10 pt-4 px-4 bg-[#f8f8f6]">
        <TouchableOpacity
          onPress={handleCreate}
          activeOpacity={0.85}
          disabled={!name.trim() || createSchedule.isPending}
          className="bg-[#b6ec13] py-4 rounded-3xl items-center justify-center"
          style={!name.trim() || createSchedule.isPending ? { opacity: 0.4 } : undefined}
        >
          {createSchedule.isPending ? (
            <ActivityIndicator size="small" color="#0f172a" />
          ) : (
            <Text className="text-[#0f172a] font-bold text-base">Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <WeekPickerBottomSheet
        visible={showWeekPicker}
        initialWeekStart={weekStart}
        onConfirm={(date) => {
          setWeekStart(date);
          setShowWeekPicker(false);
        }}
        onClose={() => setShowWeekPicker(false)}
      />
    </SafeAreaView>
  );
}
