import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OTPInput } from '@/components/OTPInput';

export default function JoinScheduleScreen() {
  const [code, setCode] = useState('');

  const canSearch = code.length === 6;

  function handleSearch() {
    console.log('Join schedule with code:', code);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]">
      <View className="flex-1 px-6">

        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-12 w-10 h-10 rounded-full bg-white border border-[#f1f5f9] items-center justify-center"
          style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
        >
          <Ionicons name="arrow-back" size={16} color="#0f172a" />
        </TouchableOpacity>

        {/* Title block */}
        <View className="mt-10">
          <Text
            className="text-[30px] font-bold text-[#0f172a]"
            style={{ letterSpacing: -0.75 }}
          >
            Join Schedule
          </Text>
          <Text className="text-[16px] text-[#64748b] mt-2">
            Enter your invitation code
          </Text>
        </View>

        {/* Main content area */}
        <View className="mt-4 gap-12">

          {/* Team icon + OTP cells */}
          <View className="gap-4">
            <View className="items-center">
              <View className="w-12 h-12 rounded-full bg-[#f1f5f9] items-center justify-center">
                <Ionicons name="people-outline" size={22} color="#64748b" />
              </View>
            </View>
            <OTPInput value={code} onChange={setCode} autoFocus />
          </View>

          {/* Action buttons */}
          <View className="pt-14 gap-4">
            {/* Search */}
            <TouchableOpacity
              onPress={handleSearch}
              disabled={!canSearch}
              className="h-16 rounded-[16px] items-center justify-center bg-[#b6ec13]"
              style={[
                { shadowColor: '#b6ec13', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
                !canSearch && { opacity: 0.4 },
              ]}
            >
              <Text className="text-[18px] font-bold text-[#0f172a]">Search</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-14 items-center justify-center"
            >
              <Text className="text-[16px] font-semibold text-[#64748b]">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help hint — pinned to bottom */}
        <View className="absolute bottom-12 left-6 right-6 items-center">
          <View className="flex-row items-center gap-2 bg-[#f1f5f9] px-4 py-2 rounded-full">
            <Ionicons name="information-circle-outline" size={14} color="#475569" />
            <Text className="text-[12px] font-medium text-[#475569]">
              Need help joining a team? Contact your manager
            </Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}
