// app/(auth)/register.tsx
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
import { useRegisterMutation } from '@/lib/queries/auth';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const register = useRegisterMutation();
  const submittingRef = useRef(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  function handleRegister() {
    if (submittingRef.current) return;
    if (!displayName.trim() || !email.trim() || !password) {
      setErrorMsg('All fields are required.');
      return;
    }
    setErrorMsg(null);
    submittingRef.current = true;
    register.mutate(
      { email: email.trim(), password, displayName: displayName.trim() },
      {
        onSuccess: () => {
          submittingRef.current = false;
          router.replace('/(app)');
        },
        onError: (err) => {
          submittingRef.current = false;
          setErrorMsg(err.message || 'Registration failed');
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
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
          >
            <Ionicons name="chevron-back" size={16} color="#0f172a" />
          </TouchableOpacity>

          <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', letterSpacing: -0.5 }}>
            Create account
          </Text>
          <Text className="mt-2 mb-10" style={{ fontSize: 15, color: '#64748b' }}>
            Join Lymoon to manage your team's schedule
          </Text>

          <View className="gap-4">
            <View>
              <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="e.g. Alex Rivera"
                placeholderTextColor="#94a3b8"
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                style={{ fontSize: 15, color: '#0f172a' }}
              />
            </View>
            <View>
              <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Email</Text>
              <TextInput
                ref={emailRef}
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
              <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Password</Text>
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                style={{ fontSize: 15, color: '#0f172a' }}
              />
            </View>

            {errorMsg ? (
              <Text style={{ fontSize: 13, color: '#ef4444' }}>{errorMsg}</Text>
            ) : null}

            <TouchableOpacity
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={register.isPending}
              className="h-[56px] rounded-[16px] items-center justify-center mt-2 bg-[#b6ec13]"
              style={{ shadowColor: '#b6ec13', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6, opacity: register.isPending ? 0.7 : 1 }}
            >
              {register.isPending ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-8 gap-1">
            <Text style={{ fontSize: 14, color: '#64748b' }}>Already have an account?</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.replace('/(auth)/email-login')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
