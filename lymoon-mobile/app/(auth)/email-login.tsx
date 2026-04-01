import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLoginMutation } from '@/lib/queries/auth';

export default function EmailLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const login = useLoginMutation();
  const submittingRef = useRef(false);
  const passwordRef = useRef<TextInput>(null);

  function handleLogin() {
    if (submittingRef.current) return;
    if (!email.trim() || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }
    setErrorMsg(null);
    submittingRef.current = true;
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          submittingRef.current = false;
          router.replace('/(app)');
        },
        onError: (err) => {
          submittingRef.current = false;
          const msg =
            err.message === 'invalid_credentials'
              ? 'Incorrect email or password.'
              : err.message || 'Login failed. Please try again.';
          setErrorMsg(msg);
        },
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            className="size-10 rounded-full bg-white items-center justify-center border border-[#f1f5f9] mb-10"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Ionicons name="chevron-back" size={16} color="#0f172a" />
          </TouchableOpacity>

          <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', letterSpacing: -0.5 }}>
            Welcome back
          </Text>
          <Text className="mt-2 mb-10" style={{ fontSize: 15, color: '#64748b' }}>
            Sign in to your Lymoon account
          </Text>

          <View className="gap-4">
            <View>
              <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                style={{ fontSize: 15, color: '#0f172a' }}
              />
            </View>

            <View>
              <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>
                Password
              </Text>
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                style={{ fontSize: 15, color: '#0f172a' }}
              />
            </View>

            {errorMsg ? (
              <Text style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>{errorMsg}</Text>
            ) : null}

            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={login.isPending}
              className="h-[56px] rounded-[16px] items-center justify-center mt-2 bg-[#b6ec13]"
              style={{
                shadowColor: '#b6ec13',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 6,
                opacity: login.isPending ? 0.7 : 1,
              }}
            >
              {login.isPending ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-8 gap-1">
            <Text style={{ fontSize: 14, color: '#64748b' }}>Don't have an account?</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/register')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
