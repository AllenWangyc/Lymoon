import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { startOfWeek, endOfWeek, format, isSameWeek } from 'date-fns';
import { CategoryPicker } from '../../src/features/schedule/components/CategoryPicker';
import { PermissionPicker } from '../../src/features/schedule/components/PermissionPicker';
import { WeekPickerBottomSheet } from '../../src/components/WeekPickerBottomSheet';
import { PageHeader } from '../../src/components/PageHeader';
import { useScheduleStore } from '../../src/stores/scheduleStore';

function formatWeekRange(date: Date): string {
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const isCurrentWeek = isSameWeek(date, new Date(), { weekStartsOn: 1 });
  const range = `${format(date, 'MMM d')} - ${format(end, 'MMM d')}`;
  return isCurrentWeek ? `${range} (This Week)` : range;
}

export default function CreateScheduleScreen() {
  const { addSchedule } = useScheduleStore();

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

    const newId = Math.random().toString(36).slice(2);

    addSchedule({
      id: newId,
      title: trimmedName,
      subtitle: `Draft · ${format(weekStart, 'MMM d')}`,
      hours: '0',
      iconBg: 'rgba(182,236,19,0.1)',
      days: [],
      scheduleType,
      memberPermission,
      startWeek: format(weekStart, 'yyyy-MM-dd'),
      description: description.trim() || undefined,
    });

    router.replace(`/schedule-created?id=${newId}`);
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
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: 8,
              }}
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
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                height: 56,
                borderWidth: 1,
                borderColor: nameError ? '#f87171' : 'rgba(182,236,19,0.2)',
                paddingHorizontal: 16,
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
                style={{
                  fontSize: 12,
                  color: '#f87171',
                  marginTop: 4,
                }}
              >
                Schedule name is required
              </Text>
            )}
          </View>

          {/* Description */}
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: 8,
              }}
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
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                minHeight: 100,
                borderWidth: 1,
                borderColor: 'rgba(182,236,19,0.2)',
                padding: 16,
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
              style={{
                fontSize: 12,
                color: wordCountColor,
                marginTop: 4,
                textAlign: 'right',
              }}
            >
              {wordCount} / 20 words
            </Text>
          </View>

          {/* Category */}
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: 4,
              }}
            >
              Category
            </Text>
            <View style={{ marginTop: 4 }}>
              <CategoryPicker value={scheduleType} onChange={setScheduleType} />
            </View>
          </View>

          {/* Start Week */}
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: 8,
              }}
            >
              Start Week
            </Text>
            <TouchableOpacity
              onPress={() => setShowWeekPicker(true)}
              activeOpacity={0.8}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                height: 56,
                borderWidth: 1,
                borderColor: 'rgba(182,236,19,0.2)',
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: 4,
              }}
            >
              Member Permissions
            </Text>
            <View style={{ marginTop: 4 }}>
              <PermissionPicker value={memberPermission} onChange={setMemberPermission} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Create Button */}
      <View
        style={{
          paddingBottom: 40,
          paddingTop: 16,
          paddingHorizontal: 16,
          backgroundColor: '#f8f8f6',
        }}
      >
        <TouchableOpacity
          onPress={handleCreate}
          activeOpacity={0.85}
          disabled={!name.trim()}
          className="bg-[#b6ec13] py-4 rounded-3xl items-center justify-center"
          style={!name.trim() ? { opacity: 0.4 } : undefined}
        >
          <Text className="text-[#0f172a] font-bold text-base">Create</Text>
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
