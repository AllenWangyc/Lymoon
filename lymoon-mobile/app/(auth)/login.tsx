import { useState } from 'react';
import { ActivityIndicator, Image, Platform, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useGoogleSignInMutation, useAppleSignInMutation } from '@/lib/queries/auth';

WebBrowser.maybeCompleteAuthSession();


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
      <View className="absolute rounded-full bg-[rgba(182,236,19,0.1)] w-64 h-64 left-[78px] top-[265px]" />
      <View className="absolute rounded-full bg-[rgba(182,236,19,0.05)] w-[288px] h-[288px] right-[39px] bottom-[353px]" />

      {/* Geometric rings */}
      <View
        className="absolute border-2 border-[rgba(182,236,19,0.2)] rounded-[128px] opacity-20 w-64 h-64 right-[-43px] top-5 rotate-[12deg]"
      >
        <View className="absolute border border-[rgba(182,236,19,0.15)] rounded-[113px] border-dashed top-3 left-3 right-3 bottom-3" />
      </View>
      <View
        className="absolute border-2 border-[rgba(182,236,19,0.2)] rounded-[160px] opacity-10 w-80 h-80 left-[-105px] top-[331px] rotate-[-45deg]"
      >
        <View className="absolute border border-[rgba(182,236,19,0.15)] rounded-[142px] border-dashed top-4 left-4 right-4 bottom-4" />
      </View>
      <View
        className="absolute border-2 border-[rgba(182,236,19,0.2)] rounded-[48px] opacity-[0.15] w-24 h-24 left-[19px] top-[132px]"
      >
        <View className="absolute border border-[rgba(182,236,19,0.15)] rounded-[41px] border-dashed top-[5px] left-[5px] right-[5px] bottom-[5px]" />
      </View>

      {/* Decorative icons */}
      <View className="absolute opacity-[0.15] right-[47px] top-[165px] rotate-[15deg]">
        <Ionicons name="leaf" size={100} color="#b6ec13" />
      </View>
      <View className="absolute opacity-10 right-[-2px] top-[509px] rotate-[-20deg]">
        <Ionicons name="restaurant-outline" size={140} color="#b6ec13" />
      </View>
      <View className="absolute opacity-10 left-5 bottom-[202px] rotate-45">
        <Ionicons name="flower-outline" size={80} color="#b6ec13" />
      </View>

      {/* Decorative pills */}
      <View className="absolute bg-[rgba(182,236,19,0.2)] rounded-full w-2 h-8 left-[145px] top-[107px] rotate-45" />
      <View className="absolute bg-[rgba(182,236,19,0.3)] rounded-full w-[6px] h-6 right-[114px] top-[335px] rotate-[-12deg]" />
      <View className="absolute bg-[rgba(182,236,19,0.15)] rounded-full w-3 h-10 left-[82px] top-[493px] rotate-[110deg]" />
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
          className="w-10 h-10"
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
        className="text-center mt-3 max-w-[287px]"
        style={{ fontSize: 18, fontWeight: '500', color: '#475569', lineHeight: 28 }}
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const googleSignIn = useGoogleSignInMutation();
  const appleSignIn = useAppleSignInMutation();

  const inExpoGo = Constants.executionEnvironment === 'storeClient';

  // Reverse-DNS redirect URI registered in app.json CFBundleURLSchemes.
  // Used for the native iOS PKCE code flow in EAS builds.
  const IOS_REDIRECT = `com.googleusercontent.apps.278239475455-acmjnhnf9tr4vii4l9us7kjc2josv0c0:/oauth2redirect/google`;

  const [request, , promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    iosClientId: inExpoGo ? undefined : (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? ''),
    redirectUri: inExpoGo ? 'https://auth.expo.io/@allenwangyc/lymoon-mobile' : IOS_REDIRECT,
    // Expo Go uses implicit id_token flow (web client + proxy).
    // EAS builds use PKCE code flow (iOS client + reverse-DNS scheme).
    responseType: inExpoGo ? AuthSession.ResponseType.IdToken : AuthSession.ResponseType.Code,
    usePKCE: !inExpoGo,
    scopes: ['openid', 'email', 'profile'],
  });

  async function handleGooglePress() {
    if (!request) return;
    setErrorMsg(null);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') return;

      let idToken: string | undefined;

      if (inExpoGo) {
        // Expo Go: implicit flow returns id_token directly in params
        idToken = result.params?.id_token;
        if (!idToken) {
          const paramKeys = Object.keys(result.params ?? {}).join(',') || 'none';
          setErrorMsg(`Google: no token (params: ${paramKeys})`);
          return;
        }
      } else {
        // EAS build: PKCE code flow — exchange code for tokens via Google's token endpoint.
        // iOS installed-app clients do not require a client_secret; PKCE is sufficient.
        const code = result.params?.code;
        if (!code) {
          const paramKeys = Object.keys(result.params ?? {}).join(',') || 'none';
          setErrorMsg(`Google: no code returned (params: ${paramKeys})`);
          return;
        }

        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            code,
            redirectUri: IOS_REDIRECT,
            clientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
            extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : {},
          },
          { tokenEndpoint: 'https://oauth2.googleapis.com/token' }
        );

        idToken = tokenResponse.idToken ?? undefined;
        if (!idToken) {
          setErrorMsg('Google: code exchanged but no id_token returned');
          return;
        }
      }

      googleSignIn.mutate(idToken, {
        onSuccess: () => router.replace('/(app)'),
        onError: (e) => {
          const msg = e instanceof Error ? e.message : String(e);
          setErrorMsg(`Google: backend error — ${msg}`);
        },
      });
    } catch (e) {
      setErrorMsg(`Google: error — ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function handleApplePress() {
    setErrorMsg(null);
    try {
      // Attempt sign-in up to twice. On first install, iOS occasionally returns
      // a credential with a null identityToken; the second attempt succeeds
      // because iOS has now established the Apple ID credential session.
      let credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        // Retry once — iOS sometimes needs a second call after the first
        // authorization to issue a valid token.
        credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
      }

      if (!credential.identityToken) {
        setErrorMsg('Apple sign-in failed. Please try again.');
        return;
      }

      appleSignIn.mutate(credential.identityToken, {
        onSuccess: () => router.replace('/(app)'),
        onError: (e) => {
          setErrorMsg('Apple sign-in failed. Please try again.');
        },
      });
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code === 'ERR_CANCELED') return;
      setErrorMsg('Apple sign-in failed. Please try again.');
    }
  }

  const isLoading = googleSignIn.isPending || appleSignIn.isPending;

  return (
    <View
      className="w-full rounded-[40px] bg-[rgba(248,250,245,0.92)] border border-[rgba(255,255,255,0.4)] p-[33px] gap-8"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.05,
        shadowRadius: 50,
        elevation: 8,
      }}
    >
      <View className="gap-4">
        <TouchableOpacity
          onPress={handleGooglePress}
          activeOpacity={0.8}
          disabled={!request || isLoading}
          className="w-full bg-white border border-[#e2e8f0] rounded-[16px] flex-row items-center justify-center h-[58px] gap-3"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            opacity: !request || isLoading ? 0.6 : 1,
          }}
        >
          {googleSignIn.isPending ? (
            <ActivityIndicator size="small" color="#334155" />
          ) : (
            <>
              <GoogleIcon size={20} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#334155' }}>
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            onPress={handleApplePress}
            activeOpacity={0.8}
            disabled={isLoading}
            className="w-full bg-black rounded-[16px] flex-row items-center justify-center h-[58px] gap-3"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {appleSignIn.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="white" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                  Continue with Apple
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {errorMsg ? (
          <Text style={{ fontSize: 13, color: '#ef4444', textAlign: 'center' }}>{errorMsg}</Text>
        ) : null}

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

      <View className="items-center gap-1">
        <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
          By continuing, you agree to our
        </Text>
        <View className="flex-row items-center gap-1">
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/terms')}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', textDecorationLine: 'underline' }}>
              Terms of Service
            </Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>&amp;</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/privacy')}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', textDecorationLine: 'underline' }}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
