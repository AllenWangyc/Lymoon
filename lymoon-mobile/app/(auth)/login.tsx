import { Alert, Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function LoginScreen() {
  return (
    <View className="flex-1 bg-[#f8f8f6]">
      <DecorativeBackground />
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-between px-6 pt-16 pb-8">
          <BrandingSection />
          <ActionCard />
        </View>
      </SafeAreaView>
    </View>
  );
}

function DecorativeBackground() {
  return (
    <View className="absolute inset-0 overflow-hidden">
      {/* Glow blobs */}
      <View
        className="absolute rounded-full bg-[rgba(182,236,19,0.1)]"
        style={{ width: 256, height: 256, left: 78, top: 265 }}
      />
      <View
        className="absolute rounded-full bg-[rgba(182,236,19,0.05)]"
        style={{ width: 288, height: 288, right: 39, bottom: 353 }}
      />

      {/* Geometric rings */}
      <View
        className="absolute border-2 border-[rgba(182,236,19,0.2)] rounded-[128px] opacity-20"
        style={{ width: 256, height: 256, right: -43, top: 20, transform: [{ rotate: '12deg' }] }}
      >
        <View
          className="absolute border border-[rgba(182,236,19,0.15)] rounded-[113px]"
          style={{ borderStyle: 'dashed', top: 12, left: 12, right: 12, bottom: 12 }}
        />
      </View>
      <View
        className="absolute border-2 border-[rgba(182,236,19,0.2)] rounded-[160px] opacity-10"
        style={{ width: 320, height: 320, left: -105, top: 331, transform: [{ rotate: '-45deg' }] }}
      >
        <View
          className="absolute border border-[rgba(182,236,19,0.15)] rounded-[142px]"
          style={{ borderStyle: 'dashed', top: 16, left: 16, right: 16, bottom: 16 }}
        />
      </View>
      <View
        className="absolute border-2 border-[rgba(182,236,19,0.2)] rounded-[48px] opacity-[0.15]"
        style={{ width: 96, height: 96, left: 19, top: 132 }}
      >
        <View
          className="absolute border border-[rgba(182,236,19,0.15)] rounded-[41px]"
          style={{ borderStyle: 'dashed', top: 5, left: 5, right: 5, bottom: 5 }}
        />
      </View>

      {/* Decorative icons */}
      <View className="absolute opacity-[0.15]" style={{ right: 47, top: 165, transform: [{ rotate: '15deg' }] }}>
        <Ionicons name="leaf" size={100} color="#b6ec13" />
      </View>
      <View className="absolute opacity-10" style={{ right: -2, top: 509, transform: [{ rotate: '-20deg' }] }}>
        <Ionicons name="restaurant-outline" size={140} color="#b6ec13" />
      </View>
      <View className="absolute opacity-10" style={{ left: 20, bottom: 202, transform: [{ rotate: '45deg' }] }}>
        <Ionicons name="flower-outline" size={80} color="#b6ec13" />
      </View>

      {/* Decorative pills */}
      <View
        className="absolute bg-[rgba(182,236,19,0.2)] rounded-full"
        style={{ width: 8, height: 32, left: 145, top: 107, transform: [{ rotate: '45deg' }] }}
      />
      <View
        className="absolute bg-[rgba(182,236,19,0.3)] rounded-full"
        style={{ width: 6, height: 24, right: 114, top: 335, transform: [{ rotate: '-12deg' }] }}
      />
      <View
        className="absolute bg-[rgba(182,236,19,0.15)] rounded-full"
        style={{ width: 12, height: 40, left: 82, top: 493, transform: [{ rotate: '110deg' }] }}
      />
    </View>
  );
}

function BrandingSection() {
  return (
    <View className="items-center">
      <View
        className="bg-[#b6ec13] rounded-[32px] size-[80px] items-center justify-center mb-8"
        style={{
          shadowColor: '#b6ec13',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        <Image
          source={require('../../assets/icon.png')}
          style={{ width: 40, height: 40 }}
          resizeMode="contain"
        />
        <View className="absolute -top-1 -right-1 size-6 rounded-full bg-[#f8f8f6] items-center justify-center">
          <View className="size-4 rounded-full bg-[#b6ec13] opacity-50" />
        </View>
      </View>
      <Text style={{ fontSize: 40, fontWeight: '700', color: '#0f172a', letterSpacing: -1.2 }}>
        Lymoon
      </Text>
      <Text
        className="text-center mt-3"
        style={{ fontSize: 18, fontWeight: '500', color: '#475569', lineHeight: 28, maxWidth: 287 }}
      >
        Refresh your productivity with a squeeze of organic collaboration.
      </Text>
    </View>
  );
}

function GoogleIcon({ size = 20 }: { size?: number }) {
  const r = size / 2;
  const inner = r * 0.6;
  const barW = r * 0.5;
  const barH = r * 0.35;

  return (
    <View style={{ width: size, height: size, borderRadius: r, overflow: 'hidden' }}>
      {/* Red — top-left */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: r, height: r, backgroundColor: '#EA4335' }} />
      {/* Blue — top-right */}
      <View style={{ position: 'absolute', top: 0, right: 0, width: r, height: r, backgroundColor: '#4285F4' }} />
      {/* Yellow — bottom-left */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: r, height: r, backgroundColor: '#FBBC05' }} />
      {/* Green — bottom-right */}
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: r, height: r, backgroundColor: '#34A853' }} />
      {/* White inner circle */}
      <View style={{ position: 'absolute', top: r - inner, left: r - inner, width: inner * 2, height: inner * 2, borderRadius: inner, backgroundColor: 'white' }} />
      {/* Blue horizontal bar (the G's crossbar) */}
      <View style={{ position: 'absolute', top: r - barH / 2, right: r - barW, width: barW, height: barH, backgroundColor: '#4285F4' }} />
    </View>
  );
}

function ActionCard() {
  function handleGooglePress() {
    Alert.alert('即将推出', 'Google 登录功能即将推出，敬请期待。');
  }

  function handleApplePress() {
    Alert.alert('即将推出', 'Apple 登录功能即将推出，敬请期待。');
  }

  return (
    <View
      className="w-full rounded-[40px] bg-[rgba(248,250,245,0.92)] border border-[rgba(255,255,255,0.4)]"
      style={{
        padding: 33,
        gap: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.05,
        shadowRadius: 50,
        elevation: 8,
      }}
    >
      <View style={{ gap: 16 }}>
        <TouchableOpacity
          onPress={handleGooglePress}
          activeOpacity={0.8}
          className="w-full bg-white border border-[#e2e8f0] rounded-[16px] flex-row items-center justify-center"
          style={{
            height: 58,
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <GoogleIcon size={20} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#334155' }}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleApplePress}
          activeOpacity={0.8}
          className="w-full bg-black rounded-[16px] flex-row items-center justify-center"
          style={{
            height: 58,
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <Ionicons name="logo-apple" size={20} color="white" />
          <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
            Continue with Apple
          </Text>
        </TouchableOpacity>

        <View className="items-center pt-2">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/email-login')}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#64748b' }}>
              Sign in with email address
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="items-center" style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
          By continuing, you agree to our
        </Text>
        <View className="flex-row items-center" style={{ gap: 4 }}>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', textDecorationLine: 'underline' }}>
              Terms of Service
            </Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>&amp;</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', textDecorationLine: 'underline' }}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
