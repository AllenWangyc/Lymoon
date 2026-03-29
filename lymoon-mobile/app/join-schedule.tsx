import { useState, useRef, useEffect } from 'react';
import { ActivityIndicator, Animated, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OTPInput } from '@/components/OTPInput';
import { SchedulePreviewCard } from '@/features/schedule/components/SchedulePreviewCard';
import { CodeInputHint } from '@/components/CodeInputHint';
import { PageHeader } from '@/components/PageHeader';
import { useScheduleLookup, useJoinSchedule } from '@/lib/queries/schedules';
import { useScheduleStore } from '@/stores/scheduleStore';
import type { SchedulePreview } from '@/types/schedule';

export default function JoinScheduleScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState(false);
  const [joined, setJoined] = useState(false);
  const [preview, setPreview] = useState<SchedulePreview | null>(null);

  const lookup = useScheduleLookup();
  const join = useJoinSchedule();
  const setPendingToast = useScheduleStore((s) => s.setPendingToast);

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
    if (preview) setPreview(null);
    lookup.reset();
    join.reset();
  }

  function handleSearch() {
    if (code.trim().length !== 6) {
      setError('Invite code must be exactly 6 characters.');
      return;
    }
    setError(null);
    lookup.mutate(code.trim().toUpperCase(), {
      onSuccess: (data) => {
        setFound(true);
        setPreview(data);
      },
      onError: (err) => {
        if (err.message === 'already_member') {
          setJoined(true);
        } else {
          setError('Invalid invite code. Please check with your manager.');
        }
      },
    });
  }

  function handleJoin() {
    join.mutate(code.trim().toUpperCase(), {
      onSuccess: () => {
        setPendingToast('You joined the schedule!');
        router.back();
      },
      onError: (err) => {
        if (err.message === 'already_member') {
          setJoined(true);
        } else {
          setError('Invalid invite code. Please check with your manager.');
        }
      },
    });
  }

  const isSearchPending = lookup.isPending;
  const isJoinPending = join.isPending;

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
            <OTPInput value={code} onChange={handleCodeChange} hasError={!!error} hasSuccess={found} hasJoined={joined} isLoading={isSearchPending} />
            {error  && <CodeInputHint status="error"   message={error} />}
            {found  && <CodeInputHint status="success" message="Schedule found" />}
            {joined && <CodeInputHint status="joined"  message="You're already a member of this schedule" />}
          </View>

          {/* Schedule preview card */}
          {found && preview !== null && (
            <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }}>
              <SchedulePreviewCard {...preview} />
            </Animated.View>
          )}

          {/* Action buttons */}
          <View className={`${found || joined ? 'pt-4' : 'pt-24'} gap-4`}>
            {/* Search / Join */}
            <TouchableOpacity
              onPress={found ? handleJoin : handleSearch}
              disabled={!canSearch || joined || isSearchPending || isJoinPending}
              className="h-16 rounded-[16px] items-center justify-center bg-[#b6ec13]"
              style={[
                { shadowColor: '#b6ec13', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
                (!canSearch || joined || isSearchPending || isJoinPending) && { opacity: 0.4 },
              ]}
            >
              {(isSearchPending || isJoinPending)
                ? <ActivityIndicator size="small" color="#0f172a" />
                : <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>{joined ? 'Already Joined' : found ? 'Join' : 'Search'}</Text>
              }
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-14 items-center justify-center"
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#64748b' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help hint — pinned to bottom */}
        <View className="absolute bottom-12 left-6 right-6 items-center">
          <View className="flex-row items-start gap-2 bg-[#f1f5f9] px-4 py-3 rounded-[16px] self-center">
            <Ionicons name="information-circle-outline" size={14} color="#475569" style={{ marginTop: 1 }} />
            <View>
              <Text style={{ fontSize: 12, color: '#475569', letterSpacing: 0.3 }}>Need help joining a team?</Text>
              <Text style={{ fontSize: 12, color: '#475569', letterSpacing: 0.3 }}>Contact your manager</Text>
            </View>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}
