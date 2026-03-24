import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_CONTENT_HEIGHT = 52;

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + HEADER_CONTENT_HEIGHT;

  return (
    <View className="flex-1 bg-[#f8f8f6]">
      <Header headerHeight={headerHeight} topInset={insets.top} />
      {/* paddingTop/Bottom are computed from dynamic insets — must stay inline */}
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + 32,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8 gap-1">
          <Text style={{ fontSize: 12, fontWeight: '500', color: '#94a3b8', letterSpacing: 1.2 }}>
            EFFECTIVE DATE
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569' }}>
            March 23, 2026
          </Text>
        </View>

        <BodyText className="mb-8">
          At Lymoon, we respect your privacy and are committed to protecting your personal data.
          This policy explains how we handle your information when you use our scheduling services.
        </BodyText>

        <Section icon="sync-outline" title="Information We Collect">
          <BodyText>We collect information that you provide directly to us, including:</BodyText>
          <View className="mt-3 gap-3 pl-2">
            <BulletItem label="Account Data:">
              {' '}Name, email address, and profile photo when you sign up using Google or Apple.
            </BulletItem>
            <BulletItem label="Calendar Data:">
              {' '}Events, attendees, and schedule availability synced from your connected calendars.
            </BulletItem>
            <BulletItem label="Usage Data:">
              {' '}Information about how you interact with our app features.
            </BulletItem>
          </View>
        </Section>

        <Section icon="shield-checkmark-outline" title="How We Use Data">
          <BodyText>
            We use the collected information for specific purposes to provide our service:
          </BodyText>
          <View className="mt-3 gap-3 pl-2">
            <BulletItem>
              Optimizing your weekly schedule and suggesting ideal sync times.
            </BulletItem>
            <BulletItem>
              Providing push notifications for upcoming events and changes.
            </BulletItem>
            <BulletItem>
              Maintaining and improving the security of the Lymoon platform.
            </BulletItem>
          </View>
        </Section>

        <Section icon="share-social-outline" title="Data Sharing" last>
          <BodyText>
            We do not sell your personal data. We only share information with third-party providers
            who help us operate our services (like cloud storage) or when required by legal
            obligation.
          </BodyText>
        </Section>
      </ScrollView>
    </View>
  );
}

function Header({ headerHeight, topInset }: { headerHeight: number; topInset: number }) {
  return (
    // height and paddingTop are computed from dynamic safe-area insets — must stay inline
    <View
      className="absolute left-0 right-0 top-0 bg-[#f8f8f6] border-b border-[#e2e8f0] z-10"
      style={{ height: headerHeight, paddingTop: topInset }}
    >
      {/* height is a named constant used in the inset computation above — stays inline */}
      <View
        className="flex-row items-center justify-between px-4"
        style={{ height: HEADER_CONTENT_HEIGHT }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="size-10 rounded-full items-center justify-center -ml-2"
        >
          <Ionicons name="chevron-back" size={22} color="#0f172a" />
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: '600', color: '#0f172a', letterSpacing: -0.45 }}>
          Privacy Policy
        </Text>

        <View className="w-8" />
      </View>
    </View>
  );
}

function Section({
  icon,
  title,
  children,
  last = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    // marginBottom is conditional on the `last` prop — dynamic value, stays inline
    <View className="gap-4" style={{ marginBottom: last ? 0 : 32 }}>
      <View className="flex-row items-center gap-3">
        <View className="size-8 rounded-2xl bg-[rgba(182,236,19,0.2)] items-center justify-center">
          <Ionicons name={icon} size={18} color="#b6ec13" />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', letterSpacing: -0.5 }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function BodyText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={className} style={{ fontSize: 15, color: '#475569', lineHeight: 24 }}>
      {children}
    </Text>
  );
}

function BulletItem({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <Text className="mt-1" style={{ fontSize: 12, color: '#b6ec13', lineHeight: 16 }}>
        ●
      </Text>
      <Text className="flex-1" style={{ fontSize: 15, color: '#475569', lineHeight: 24 }}>
        {label && (
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>{label}</Text>
        )}
        {children}
      </Text>
    </View>
  );
}
