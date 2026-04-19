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
import * as Clipboard from 'expo-clipboard';
import { PageHeader } from '../../src/components/PageHeader';
import { useToast } from '../../src/hooks/useToast';

function InviteCodeDisplay({ code }: { code: string }) {
  const chars = code.split('');

  return (
    <View className="flex-row items-center gap-[10px]">
      {chars.map((char, i) => (
        <View
          key={i}
          className="w-10 h-12 rounded-[10px] bg-[#f8f8f6] border border-[#e2e8f0] items-center justify-center"
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
    <View className="flex-row items-center gap-3">
      <View className="w-9 h-9 rounded-[10px] bg-[rgba(182,236,19,0.12)] items-center justify-center">
        <Ionicons name={icon as any} size={18} color="#5a8a00" />
      </View>
      <Text className="flex-1" style={{ fontSize: 14, color: '#64748b', lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

export default function ScheduleCreatedScreen() {
  const { id, inviteCode, title } = useLocalSearchParams<{
    id: string;
    inviteCode: string;
    title: string;
  }>();
  const { showToast } = useToast();

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
    await Clipboard.setStringAsync(inviteCode);
    showToast('Code copied!', 'success');
  }

  function handleOpenSchedule() {
    router.replace('/');
    router.push(`/schedule/${id}`);
  }

  function handleGoHome() {
    router.replace('/');
  }

  if (!id || !inviteCode || !title) {
    return null; // should never happen
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]">
      {/* Header */}
      <View className="px-4 pt-3 pb-1">
        <PageHeader title="Schedule Created" onBack={handleGoHome} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ① Success Icon */}
        <View className="items-center mt-10">
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <View
              className="size-[72px] rounded-full bg-[#b6ec13] items-center justify-center"
              style={{
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
          className="items-center mt-6 px-6"
          style={{
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
          <Text
            className="mt-[6px] text-center"
            style={{ fontSize: 16, color: '#64748b', fontWeight: '500' }}
          >
            {title}
          </Text>
        </Animated.View>

        {/* ③ Invite Code Card */}
        <Animated.View
          className="mx-4 mt-7"
          style={{
            opacity: codeOpacity,
            transform: [{ translateY: codeSlide }],
          }}
        >
          <View
            className="bg-white rounded-[20px] border-2 border-[#b6ec13] py-6 px-5 items-center gap-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Label */}
            <Text
              className="uppercase"
              style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.5 }}
            >
              Invite Code
            </Text>

            {/* Character boxes */}
            <InviteCodeDisplay code={inviteCode} />

            {/* Copy button */}
            <Animated.View className="mt-2" style={{ transform: [{ scale: copyScale }] }}>
              <TouchableOpacity
                onPress={handleCopy}
                onPressIn={handleCopyPressIn}
                onPressOut={handleCopyPressOut}
                activeOpacity={1}
                className="flex-row items-center gap-[6px] bg-transparent border-[1.5px] border-[#b6ec13] px-5 py-[10px] rounded-full"
              >
                <Ionicons name="copy-outline" size={15} color="#0f172a" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Copy Code</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Helper text */}
            <Text
              className="text-center"
              style={{ fontSize: 12, color: '#94a3b8', lineHeight: 18 }}
            >
              Share this code with your team members{'\n'}so they can join this schedule
            </Text>
          </View>
        </Animated.View>

        {/* ④ What's next hints */}
        <Animated.View
          className="mx-4 mt-4"
          style={{ opacity: hintsOpacity }}
        >
          <View
            className="bg-white rounded-2xl p-4 gap-3"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <Text
              className="uppercase mb-[2px]"
              style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2 }}
            >
              What's next
            </Text>
            <HintRow icon="calendar-outline" text="Add shifts from the Schedule Detail page" />
            <View className="h-px bg-[#f1f5f9]" />
            <HintRow icon="people-outline" text="Members can join using the invite code above" />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom buttons */}
      <View className="px-4 pb-8 pt-3 bg-[#f8f8f6] gap-[10px]">
        <TouchableOpacity
          onPress={handleOpenSchedule}
          activeOpacity={0.85}
          className="bg-[#0f172a] py-4 rounded-full items-center justify-center"
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>Open Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleGoHome}
          activeOpacity={0.85}
          className="py-4 rounded-full items-center justify-center"
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#64748b' }}>Back Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
