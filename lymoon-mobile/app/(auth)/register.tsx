import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegisterMutation, useSendVerificationMutation } from '@/lib/queries/auth';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [codeSuccessMsg, setCodeSuccessMsg] = useState<string | null>(null);

  const submittingRef = useRef(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const codeRef = useRef<TextInput>(null);

  const register = useRegisterMutation();
  const sendVerification = useSendVerificationMutation();

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function handleSendCode() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email first.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg(null);
    sendVerification.mutate(trimmedEmail, {
      onSuccess: () => {
        setCodeSent(true);
        setCountdown(60);
        setCodeSuccessMsg(`Code sent to ${trimmedEmail}`);
        setTimeout(() => codeRef.current?.focus(), 300);
      },
      onError: (err) => {
        const msg =
          err.message === 'rate_limited'
            ? 'Please wait 60 seconds before requesting another code.'
            : 'Failed to send code. Please check your email and try again.';
        setErrorMsg(msg);
      },
    });
  }

  function handleRegister() {
    if (submittingRef.current) return;
    if (!displayName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!codeSent) {
      setErrorMsg('Please verify your email before registering.');
      return;
    }
    if (verificationCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    setErrorMsg(null);
    submittingRef.current = true;
    register.mutate(
      {
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        verificationCode,
      },
      {
        onSuccess: () => {
          submittingRef.current = false;
          router.replace('/(app)');
        },
        onError: (err) => {
          submittingRef.current = false;
          const errorMap: Record<string, string> = {
            email_taken: 'An account with this email already exists.',
            code_expired: 'Verification code has expired. Please request a new one.',
            invalid_code: 'Invalid verification code. Please try again.',
            too_many_attempts: 'Too many incorrect attempts. Please request a new code.',
          };
          setErrorMsg(errorMap[err.message] ?? 'Registration failed. Please try again.');
        },
      },
    );
  }

  const sendButtonDisabled = sendVerification.isPending || countdown > 0;
  const canSubmit = verificationCode.length === 6 && !register.isPending;

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-4">
          {/* Back button */}
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
            {/* Name */}
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

            {/* Email + Send button */}
            <View>
              <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Email</Text>
              <View className="flex-row gap-2 items-center">
                <TextInput
                  ref={emailRef}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (codeSent) {
                      setCodeSent(false);
                      setVerificationCode('');
                      setCodeSuccessMsg(null);
                    }
                  }}
                  placeholder="name@example.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  editable={!sendVerification.isPending}
                  className="flex-1 h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                  style={{ fontSize: 15, color: '#0f172a' }}
                />
                <TouchableOpacity
                  onPress={handleSendCode}
                  activeOpacity={0.75}
                  disabled={sendButtonDisabled}
                  className="h-[52px] rounded-[14px] items-center justify-center px-3 bg-white border border-[#e2e8f0]"
                  style={{
                    minWidth: 100,
                    opacity: sendButtonDisabled ? 0.5 : 1,
                  }}
                >
                  {sendVerification.isPending ? (
                    <ActivityIndicator size="small" color="#64748b" />
                  ) : (
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: '#64748b',
                    }}>
                      {countdown > 0 ? `${countdown}s` : codeSent ? 'Resend Code' : 'Send Code'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Verification code — shown after sending */}
            {codeSent && (
              <View>
                <View className="flex-row items-center gap-1 mb-2">
                  <Text style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Verification Code</Text>
                  {codeSuccessMsg && (
                    <Text style={{ fontSize: 12, color: '#22c55e' }}>· {codeSuccessMsg}</Text>
                  )}
                </View>
                <TextInput
                  ref={codeRef}
                  value={verificationCode}
                  onChangeText={(v) => setVerificationCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                  style={{ fontSize: 20, fontWeight: '600', color: '#0f172a', letterSpacing: 6 }}
                />
              </View>
            )}

            {/* Password */}
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
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                style={{ fontSize: 15, color: '#0f172a', letterSpacing: 0 }}
              />
            </View>

            {/* Confirm Password */}
            <View>
              <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>Confirm Password</Text>
              <TextInput
                ref={confirmPasswordRef}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
                style={{ fontSize: 15, color: '#0f172a', letterSpacing: 0 }}
              />
            </View>

            {/* Error message */}
            {errorMsg ? (
              <Text style={{ fontSize: 13, color: '#ef4444' }}>{errorMsg}</Text>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={!canSubmit}
              className="h-[56px] rounded-[16px] items-center justify-center mt-2"
              style={{
                backgroundColor: '#b6ec13',
                shadowColor: '#b6ec13',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: canSubmit ? 0.25 : 0,
                shadowRadius: 12,
                elevation: canSubmit ? 6 : 0,
                opacity: canSubmit ? 1 : 0.45,
              }}
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
