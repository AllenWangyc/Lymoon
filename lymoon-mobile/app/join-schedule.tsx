import { useState, useRef, useEffect } from 'react';
import { ActivityIndicator, Animated, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OTPInput } from '@/components/OTPInput';
import { SchedulePreviewCard } from '@/features/schedule/components/SchedulePreviewCard';
import { CodeInputHint } from '@/components/CodeInputHint';
import { PageHeader } from '@/components/PageHeader';
import { useScheduleStore } from '@/stores/scheduleStore';
import { ENGINEERING_SPRINT_TEMPLATE } from '@/features/schedule/constants';

const MOCK_INVALID_CODE = '000000';
const MOCK_JOINED_CODE  = '111111';

const MOCK_SCHEDULE_PREVIEW = {
  scheduleName: 'Engineering Sprint',
  managerName: 'Sarah Chen',
  memberCount: 12,
};

export default function JoinScheduleScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState(false);
  const [joined, setJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addSchedule } = useScheduleStore();

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (found || joined) {
      cardOpacity.setValue(0);
      cardTranslateY.setValue(12);
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(cardTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [found, joined]);

  const canSearch = code.length === 6;

  function handleCodeChange(val: string) {
    setCode(val);
    if (error) setError(null);
    if (found) setFound(false);
    if (joined) setJoined(false);
  }

  function handleSearch() {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (code === MOCK_INVALID_CODE) {
        setError('Invalid invite code. Please check with your manager.');
      } else if (code === MOCK_JOINED_CODE) {
        setJoined(true);
      } else {
        setFound(true);
      }
    }, 900);
  }

  function handleJoin() {
    addSchedule(
      { ...ENGINEERING_SPRINT_TEMPLATE, id: Math.random().toString(36).slice(2) },
      `Joined "${ENGINEERING_SPRINT_TEMPLATE.title}" successfully`,
    );
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]">
      <View className="flex-1 px-6">

        {/* Header */}
        <View className="mt-6">
          <PageHeader
            title="Join Schedule"
            subtitle="Enter your invitation code"
            onBack={() => router.back()}
          />
        </View>

        {/* Main content area */}
        <View className="mt-12 gap-12">

          {/* Team icon + OTP cells */}
          <View className="gap-4">
            <View className="items-center">
              <View className="w-12 h-12 rounded-full bg-[#f1f5f9] items-center justify-center">
                <Ionicons name="people-outline" size={22} color="#64748b" />
              </View>
            </View>
            <OTPInput value={code} onChange={handleCodeChange} hasError={!!error} hasSuccess={found} hasJoined={joined} isLoading={isLoading} />
            {error  && <CodeInputHint status="error"   message={error} />}
            {found  && <CodeInputHint status="success" message="Schedule found" />}
            {joined && <CodeInputHint status="joined"  message="You're already a member of this schedule" />}
          </View>

          {/* Schedule preview card */}
          {(found || joined) && (
            <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }}>
              <SchedulePreviewCard {...MOCK_SCHEDULE_PREVIEW} />
            </Animated.View>
          )}

          {/* Action buttons */}
          <View className={`${found || joined ? 'pt-4' : 'pt-24'} gap-4`}>
            {/* Search / Join */}
            <TouchableOpacity
              onPress={found ? handleJoin : handleSearch}
              disabled={!canSearch || joined || isLoading}
              className="h-16 rounded-[16px] items-center justify-center bg-[#b6ec13]"
              style={[
                { shadowColor: '#b6ec13', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
                (!canSearch || joined || isLoading) && { opacity: 0.4 },
              ]}
            >
              {isLoading
                ? <ActivityIndicator size="small" color="#0f172a" />
                : <Text className="text-[18px] font-bold text-[#0f172a]">{found || joined ? 'Join' : 'Search'}</Text>
              }
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-14 items-center justify-center"
            >
              <Text className="text-[16px] font-semibold text-[#64748b]">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help hint — pinned to bottom */}
        <View className="absolute bottom-12 left-6 right-6 items-center">
          <View className="flex-row items-start gap-2 bg-[#f1f5f9] px-4 py-3 rounded-[16px] self-center">
            <Ionicons name="information-circle-outline" size={14} color="#475569" style={{ marginTop: 1 }} />
            <View>
              <Text className="text-[12px] text-[#475569]" style={{ letterSpacing: 0.3 }}>Need help joining a team?</Text>
              <Text className="text-[12px] text-[#475569]" style={{ letterSpacing: 0.3 }}>Contact your manager</Text>
            </View>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}
