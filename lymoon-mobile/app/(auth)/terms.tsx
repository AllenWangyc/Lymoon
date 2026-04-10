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
          These Terms of Service ("Terms") govern your access to and use of Lymoon, a shift
          scheduling platform ("Service") operated by Yuchen Wang ("I," "me," or "my"). By
          creating an account or using the Service, you agree to be bound by these Terms.
        </BodyText>

        <Section title="1. Acceptance of Terms">
          <Text style={{ fontSize: 16, color: '#334155', lineHeight: 26 }}>
            By registering for or using Lymoon, you confirm that you have read, understood, and
            agree to these Terms and our{' '}
            <Text
              onPress={() => router.push('/(auth)/privacy')}
              suppressHighlighting
              style={{ fontWeight: '600', color: '#b6ec13' }}
            >
              Privacy Policy
            </Text>
            . If you do not agree, you may not use the Service. These Terms form a binding
            agreement between you and Yuchen Wang, the individual developer operating Lymoon.
          </Text>
        </Section>

        <Section title="2. Description of Service">
          <BodyText>
            Lymoon is a mobile shift scheduling platform for small business teams. Managers can
            create schedules, assign shifts, and manage team members. Team members can view their
            assigned shifts and receive in-app notifications for schedule updates.
          </BodyText>
          <BodyText className="mt-3">
            Access to a team schedule is granted via a unique invitation code issued by a schedule
            manager. All notifications are delivered within the app only.
          </BodyText>
        </Section>

        <Section title="3. User Accounts">
          <BodyText>
            To use Lymoon, you must register for an account. By registering, you agree to:
          </BodyText>
          <View className="mt-2 gap-1">
            <BulletItem>Provide accurate, current, and complete information at registration.</BulletItem>
            <BulletItem>Keep your login credentials confidential and not share them with others.</BulletItem>
            <BulletItem>Not transfer your account to any other person.</BulletItem>
            <BulletItem>
              Notify us immediately of any suspected unauthorized access to your account.
            </BulletItem>
          </View>
        </Section>

        <Section title="4. Roles and Permissions">
          <BodyText>Each schedule in Lymoon has two user roles:</BodyText>
          <View className="mt-2 gap-1">
            <BulletItem>
              Manager: Can create and publish schedules, assign or modify any shift, and add or
              remove team members.
            </BulletItem>
            <BulletItem>
              Member: Can view assigned shifts and, depending on the schedule's settings, may
              add or edit their own shifts.
            </BulletItem>
          </View>
          <BodyText className="mt-3">
            Managers are responsible for ensuring their use of team member data complies with
            applicable employment and privacy laws.
          </BodyText>
        </Section>

        <Section title="5. Service Usage & Restrictions">
          <BodyText>
            You agree to use the Service only for its intended purpose of shift scheduling and
            team management. You must not use the Service for any unlawful purpose or in any way
            that interferes with its proper functioning.
          </BodyText>
          <CalloutBox>
            Prohibited activities include: reverse engineering or decompiling the software,
            scraping or bulk-downloading data, attempting to bypass security measures, or
            impersonating any other user or organization.
          </CalloutBox>
        </Section>

        <Section title="6. Account Termination">
          <BodyText>
            You may delete your account at any time by contacting us at a.wangyc@gmail.com. We
            may suspend or terminate your access to the Service without notice if we determine
            that you have violated these Terms or that your actions may harm other users or the
            platform.
          </BodyText>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <BodyText>
            The Service is provided "as is" and "as available," without warranties of any kind,
            either express or implied. To the fullest extent permitted by applicable law, we
            disclaim all warranties, including implied warranties of merchantability, fitness for
            a particular purpose, and non-infringement. We do not warrant that the Service will
            be uninterrupted or error-free.
          </BodyText>
        </Section>

        <Section title="8. Limitation of Liability">
          <BodyText>
            To the maximum extent permitted by applicable law, Yuchen Wang (the developer of
            Lymoon) shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages — including loss of profits, data, or goodwill — arising from
            your use of or inability to use the Service.
          </BodyText>
        </Section>

        <Section title="9. Governing Law">
          <BodyText>
            These Terms shall be governed by and construed in accordance with the laws of the
            jurisdiction in which Lymoon operates, without regard to its conflict of law
            provisions. Any disputes shall be resolved in the competent courts of that
            jurisdiction.
          </BodyText>
        </Section>

        <Section title="10. Changes to These Terms">
          <BodyText>
            We may update these Terms from time to time. We will notify you of material changes
            via an in-app notification. Your continued use of the Service after the updated Terms
            take effect constitutes your acceptance of the changes.
          </BodyText>
        </Section>

        <Section title="11. Contact Us" last>
          <BodyText>
            If you have any questions about these Terms, please contact us at:
          </BodyText>
          <View className="mt-2">
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
