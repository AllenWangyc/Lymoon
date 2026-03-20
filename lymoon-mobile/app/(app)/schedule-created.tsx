import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { parseISO, endOfWeek, format } from 'date-fns';
import * as Clipboard from 'expo-clipboard';
import { PageHeader } from '../../src/components/PageHeader';
import { useScheduleStore } from '../../src/stores/scheduleStore';
import { useToast } from '../../src/hooks/useToast';

function InviteCodeDisplay({ code }: { code: string }) {
  const chars = code.split('');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {chars.map((char, i) => (
        <View
          key={i}
          style={{
            width: 40,
            height: 48,
            borderRadius: 10,
            backgroundColor: '#f8f8f6',
            borderWidth: 1,
            borderColor: '#e2e8f0',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: '#0f172a',
              letterSpacing: 0,
            }}
          >
            {char}
          </Text>
        </View>
      ))}
    </View>
  );
}

function HintRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: 'rgba(182,236,19,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon as any} size={18} color="#5a8a00" />
      </View>
      <Text style={{ flex: 1, fontSize: 14, color: '#64748b', lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

export default function ScheduleCreatedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const schedules = useScheduleStore((s) => s.schedules);
  const { showToast } = useToast();

  const schedule = schedules.find((s) => s.id === id);

  // Animations
  const iconScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(24)).current;
  const codeOpacity = useRef(new Animated.Value(0)).current;
  const codeSlide = useRef(new Animated.Value(24)).current;
  const hintsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 80,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(contentSlide, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(codeOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(codeSlide, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]),
      Animated.timing(hintsOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, []);

  const copyScale = useRef(new Animated.Value(1)).current;

  function handleCopyPressIn() {
    Animated.spring(copyScale, { toValue: 0.93, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }

  function handleCopyPressOut() {
    Animated.spring(copyScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  }

  async function handleCopy() {
    if (!schedule?.inviteCode) return;
    await Clipboard.setStringAsync(schedule.inviteCode);
    showToast('Code copied!', 'success');
  }

  function handleOpenSchedule() {
    if (!id) return;
    router.replace(`/schedule/${id}`);
  }

  function handleGoHome() {
    router.replace('/');
  }

  const weekRange = schedule?.startWeek
    ? (() => {
        const start = parseISO(schedule.startWeek);
        const end = endOfWeek(start, { weekStartsOn: 1 });
        return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
      })()
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f8f6' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <PageHeader title="Schedule Created" onBack={handleGoHome} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ① Success Icon */}
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: '#b6ec13',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#b6ec13',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Ionicons name="checkmark" size={40} color="#0f172a" />
            </View>
          </Animated.View>
        </View>

        {/* ② Headline + schedule info */}
        <Animated.View
          style={{
            alignItems: 'center',
            marginTop: 24,
            paddingHorizontal: 24,
            opacity: contentOpacity,
            transform: [{ translateY: contentSlide }],
          }}
        >
          <Text
            style={{
              fontSize: 26,
              fontWeight: '700',
              color: '#0f172a',
              letterSpacing: -0.5,
            }}
          >
            Schedule Created!
          </Text>
          {schedule && (
            <>
              <Text
                style={{
                  fontSize: 16,
                  color: '#64748b',
                  marginTop: 6,
                  fontWeight: '500',
                  textAlign: 'center',
                }}
              >
                {schedule.title}
              </Text>
              {weekRange && (
                <Text
                  style={{
                    fontSize: 13,
                    color: '#94a3b8',
                    marginTop: 4,
                    textAlign: 'center',
                  }}
                >
                  {weekRange}
                </Text>
              )}
            </>
          )}
        </Animated.View>

        {/* ③ Invite Code Card */}
        <Animated.View
          style={{
            marginHorizontal: 16,
            marginTop: 28,
            opacity: codeOpacity,
            transform: [{ translateY: codeSlide }],
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              borderWidth: 2,
              borderColor: '#b6ec13',
              paddingVertical: 24,
              paddingHorizontal: 20,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
              gap: 16,
            }}
          >
            {/* Label */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#94a3b8',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Invite Code
            </Text>

            {/* Character boxes */}
            {schedule?.inviteCode ? (
              <InviteCodeDisplay code={schedule.inviteCode} />
            ) : (
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', letterSpacing: 6 }}>
                ------
              </Text>
            )}

            {/* Copy button */}
            <Animated.View style={{ transform: [{ scale: copyScale }], marginTop: 8 }}>
              <TouchableOpacity
                onPress={handleCopy}
                onPressIn={handleCopyPressIn}
                onPressOut={handleCopyPressOut}
                activeOpacity={1}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  borderColor: '#b6ec13',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 100,
                }}
              >
                <Ionicons name="copy-outline" size={15} color="#0f172a" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Copy Code</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Helper text */}
            <Text
              style={{
                fontSize: 12,
                color: '#94a3b8',
                textAlign: 'center',
                lineHeight: 18,
              }}
            >
              Share this code with your team members{'\n'}so they can join this schedule
            </Text>
          </View>
        </Animated.View>

        {/* ④ What's next hints */}
        <Animated.View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            opacity: hintsOpacity,
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 16,
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#94a3b8',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              What's next
            </Text>
            <HintRow icon="calendar-outline" text="Add shifts from the Schedule Detail page" />
            <View style={{ height: 1, backgroundColor: '#f1f5f9' }} />
            <HintRow icon="people-outline" text="Members can join using the invite code above" />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom buttons */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 32,
          paddingTop: 12,
          backgroundColor: '#f8f8f6',
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={handleOpenSchedule}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#0f172a',
            paddingVertical: 16,
            borderRadius: 100,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>Open Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleGoHome}
          activeOpacity={0.85}
          style={{
            paddingVertical: 16,
            borderRadius: 100,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#64748b' }}>Back Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
