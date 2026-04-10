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
          Lymoon is a shift scheduling platform for small business teams. This Privacy Policy
          describes how Lymoon ("we," "us," or "our") collects, uses, and protects your
          information when you use our mobile application.
        </BodyText>

        <Section icon="document-text-outline" title="Information We Collect">
          <BodyText>We collect only the information necessary to provide our service:</BodyText>
          <View className="mt-3 gap-3 pl-2">
            <BulletItem label="Account Data:">
              {' '}Your name and email address, provided when you create an account.
            </BulletItem>
            <BulletItem label="Schedule & Shift Data:">
              {' '}Team memberships, assigned shifts, and scheduling information created within
              the app by you or your managers.
            </BulletItem>
            <BulletItem label="Usage Data:">
              {' '}Basic information about how you interact with app features, used solely to
              improve the service.
            </BulletItem>
          </View>
        </Section>

        <Section icon="shield-checkmark-outline" title="How We Use Your Data">
          <BodyText>We use your information only to provide and improve Lymoon:</BodyText>
          <View className="mt-3 gap-3 pl-2">
            <BulletItem>Delivering the shift scheduling and team management service.</BulletItem>
            <BulletItem>
              Sending in-app notifications about shift assignments, changes, and updates.
            </BulletItem>
            <BulletItem>Enabling managers to create and publish team schedules.</BulletItem>
            <BulletItem>
              Maintaining platform security and preventing unauthorized access.
            </BulletItem>
            <BulletItem>Improving app performance and user experience.</BulletItem>
          </View>
        </Section>

        <Section icon="share-social-outline" title="Data Sharing">
          <BodyText>
            We do not sell your personal data. We share your information only in these limited
            circumstances:
          </BodyText>
          <View className="mt-3 gap-3 pl-2">
            <BulletItem label="Service Providers:">
              {' '}Trusted third-party providers who help us operate the platform (such as cloud
              database hosting), bound by strict confidentiality agreements.
            </BulletItem>
            <BulletItem label="Legal Requirements:">
              {' '}When required by applicable law, court order, or to protect the rights and
              safety of our users and the public.
            </BulletItem>
          </View>
        </Section>

        <Section icon="time-outline" title="Data Retention">
          <BodyText>
            We retain your personal data for as long as your account is active. Upon account
            deletion, we will remove your personal data within 30 days, unless a longer retention
            period is required by applicable law.
          </BodyText>
        </Section>

        <Section icon="person-outline" title="Your Rights">
          <BodyText>
            Depending on your location, you may have the following rights regarding your personal
            data:
          </BodyText>
          <View className="mt-3 gap-3 pl-2">
            <BulletItem label="Access:">
              {' '}Request a copy of the personal data we hold about you.
            </BulletItem>
            <BulletItem label="Correction:">
              {' '}Update your account information at any time within the app settings.
            </BulletItem>
            <BulletItem label="Deletion:">
              {' '}Request deletion of your account and all associated personal data.
            </BulletItem>
            <BulletItem label="Portability:">
              {' '}Request a copy of your data in a portable format (where technically feasible).
            </BulletItem>
          </View>
          <BodyText className="mt-3">
            To exercise these rights, contact us at a.wangyc@gmail.com.
          </BodyText>
        </Section>

        <Section icon="lock-closed-outline" title="Security">
          <BodyText>
            We protect your data using industry-standard security measures, including encrypted
            data transmission (HTTPS/TLS) and secure cloud infrastructure. While we take
            reasonable precautions, no method of internet transmission is 100% secure, and we
            cannot guarantee absolute security.
          </BodyText>
        </Section>

        <Section icon="people-outline" title="Children's Privacy">
          <BodyText>
            Lymoon is not directed at children under 13 years of age. We do not knowingly collect
            personal information from children under 13. If you believe a child has provided us
            with personal data, please contact us and we will delete it promptly.
          </BodyText>
        </Section>

        <Section icon="refresh-outline" title="Changes to This Policy">
          <BodyText>
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes via an in-app notification. Continued use of Lymoon after changes take effect
            constitutes your acceptance of the updated policy.
          </BodyText>
        </Section>

        <Section icon="mail-outline" title="Contact Us" last>
          <BodyText>
            If you have any questions about this Privacy Policy or how we handle your data,
            please contact us:
          </BodyText>
          <View className="mt-3 gap-1 pl-2">
            <BodyText>Email: a.wangyc@gmail.com</BodyText>
          </View>
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
