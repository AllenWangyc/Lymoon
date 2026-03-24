import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_CONTENT_HEIGHT = 52;

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + HEADER_CONTENT_HEIGHT;

  return (
    <View className="flex-1 bg-[#f8f8f6]">
      <Header headerHeight={headerHeight} topInset={insets.top} />
      {/* paddingTop/paddingBottom are computed from dynamic insets — must stay inline */}
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + 32,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-8" style={{ fontSize: 14, fontWeight: '500', color: '#64748b' }}>
          Last updated: March 23, 2026
        </Text>

        <BodyText className="mb-8">
          Welcome to our scheduling platform. These Terms of Service ("Terms") govern your access
          to and use of our services, including our mobile application and website. Please read them
          carefully before using the service.
        </BodyText>

        <Section title="1. Acceptance of Terms">
          <Text style={{ fontSize: 16, color: '#334155', lineHeight: 26 }}>
            By creating an account or using our services, you agree to be bound by these Terms and
            our{' '}
            <Text onPress={() => router.push('/(auth)/privacy')} suppressHighlighting style={{ fontWeight: '600', color: '#b6ec13' }}>Privacy Policy</Text>. If you do
            not agree to these terms, please do not use the service.
          </Text>
        </Section>

        <Section title="2. User Accounts">
          <BodyText>
            To access certain features of the service, you must register for an account. You agree
            to provide accurate, current, and complete information during the registration process
            and to update such information to keep it accurate.
          </BodyText>
          <View className="mt-2 gap-1">
            <BulletItem>You are responsible for safeguarding your password.</BulletItem>
            <BulletItem>You agree not to disclose your password to any third party.</BulletItem>
            <BulletItem>
              You must notify us immediately upon becoming aware of any breach of security.
            </BulletItem>
          </View>
        </Section>

        <Section title="3. Service Usage & Restrictions">
          <BodyText>
            Our platform is designed to help you stay in sync and plan your week efficiently. You
            agree not to use the service for any illegal purposes or to interfere with the proper
            functioning of the platform.
          </BodyText>
          <CalloutBox>
            Prohibited activities include reverse engineering the software, scraping data, or
            attempting to bypass security measures.
          </CalloutBox>
        </Section>

        <Section title="4. Subscription and Payments">
          <BodyText>
            Some parts of the Service are billed on a subscription basis. You will be billed in
            advance on a recurring and periodic basis. Billing cycles are set on a monthly or annual
            basis, depending on the type of subscription plan you select when purchasing.
          </BodyText>
        </Section>

        <Section title="5. Limitation of Liability" last>
          <BodyText>
            In no event shall our company, nor its directors, employees, partners, agents,
            suppliers, or affiliates, be liable for any indirect, incidental, special, consequential
            or punitive damages, including without limitation, loss of profits, data, use, goodwill,
            or other intangible losses.
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
          Terms of Service
        </Text>

        <View className="w-8" />
      </View>
    </View>
  );
}

function Section({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    // marginBottom is conditional on the `last` prop — dynamic value, stays inline
    <View className="gap-4" style={{ marginBottom: last ? 0 : 32 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', lineHeight: 28 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function BodyText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={className} style={{ fontSize: 16, color: '#334155', lineHeight: 26 }}>
      {children}
    </Text>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row items-start pl-1">
      <Text className="mr-2" style={{ fontSize: 16, color: '#334155', lineHeight: 26 }}>
        •
      </Text>
      <Text className="flex-1" style={{ fontSize: 16, color: '#334155', lineHeight: 26 }}>
        {children}
      </Text>
    </View>
  );
}

function CalloutBox({ children }: { children: React.ReactNode }) {
  return (
    <View className="mt-2 border-l-4 border-l-[#b6ec13] bg-[rgba(182,236,19,0.1)] rounded-tr-[8px] rounded-br-[8px] pl-5 pr-4 py-4">
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#1e293b', lineHeight: 20 }}>
        {children}
      </Text>
    </View>
  );
}
