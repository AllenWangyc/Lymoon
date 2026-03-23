import { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EmailLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleLogin() {
    // TODO: replace with useMutation from lib/queries/auth.ts
    // POST /api/auth/login { email, password }
    // On success: store JWT in authStore, router.replace('/(app)')
    console.log('login pressed', { email, password });
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]">
      <View className="flex-1 px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
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

        <View style={{ gap: 16 }}>
          <View>
            <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
              style={{ fontSize: 15, color: '#0f172a' }}
            />
          </View>

          <View>
            <Text className="mb-2" style={{ fontSize: 13, fontWeight: '500', color: '#475569' }}>
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              className="h-[52px] bg-white border border-[#e2e8f0] rounded-[14px] px-4"
              style={{ fontSize: 15, color: '#0f172a' }}
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.85}
            className="h-[56px] rounded-[16px] items-center justify-center mt-2 bg-[#b6ec13]"
            style={{
              shadowColor: '#b6ec13',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-8" style={{ gap: 4 }}>
          <Text style={{ fontSize: 14, color: '#64748b' }}>Don't have an account?</Text>
          <TouchableOpacity activeOpacity={0.7}>
            {/* TODO: navigate to register screen when built */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
