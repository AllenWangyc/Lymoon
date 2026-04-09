import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuthStore } from '@/stores/authStore';
import { useDeleteAccountMutation, useUpdateDisplayNameMutation } from '@/lib/queries/account';
import { ApiError } from '@/lib/api';
import { EditDisplayNameSheet } from '@/features/settings/components/EditDisplayNameSheet';
import { DeleteAccountSheet } from '@/features/settings/components/DeleteAccountSheet';

export default function SettingsScreen() {
  const { userName, userEmail, avatarInitials, clearUser } = useAuthStore();
  const [editSheetVisible, setEditSheetVisible] = useState(false);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const updateDisplayName = useUpdateDisplayNameMutation();
  const deleteAccount = useDeleteAccountMutation();

  const appVersion = Constants.expoConfig?.version ?? '—';

  function handleLogOut() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          clearUser();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  function handleConfirmName(newName: string) {
    updateDisplayName.mutate(newName);
  }

  function handleConfirmDelete() {
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        setDeleteSheetVisible(false);
        clearUser();
        router.replace('/(auth)/login');
      },
      onError: (err: unknown) => {
        setDeleteSheetVisible(false);
        if (
          err instanceof ApiError &&
          err.status === 409 &&
          err.body &&
          typeof err.body === 'object' &&
          'error' in err.body &&
          (err.body as { error: string }).error === 'sole_manager_blocking' &&
          'schedules' in err.body &&
          Array.isArray((err.body as { schedules: unknown }).schedules)
        ) {
          const schedules = (err.body as { schedules: string[] }).schedules;
          const list = schedules.join(', ');
          Alert.alert(
            'Cannot Delete Account',
            `You are the sole manager of: ${list}. Transfer the manager role or dissolve these schedules before deleting your account.`,
          );
        }
      },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f6]">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}>

        {/* Profile card */}
        <View
          className="bg-white rounded-3xl px-5 py-6 items-center mb-8"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
        >
          <UserAvatar name={userName} initials={avatarInitials} size={72} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 12 }}>
            {userName}
          </Text>
          {userEmail ? (
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              {userEmail}
            </Text>
          ) : null}
        </View>

        {/* Account section */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>
          ACCOUNT
        </Text>
        <View
          className="bg-white rounded-2xl overflow-hidden mb-8"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
        >
          <TouchableOpacity
            onPress={() => setEditSheetVisible(true)}
            activeOpacity={0.7}
            className="flex-row items-center px-5 h-14"
          >
            <Text style={{ fontSize: 15, color: '#0f172a', flex: 1 }}>Edit Display Name</Text>
            <Text style={{ fontSize: 15, color: '#cbd5e1' }}>›</Text>
          </TouchableOpacity>

          <View className="h-px bg-[#f1f5f9] mx-5" />

          <TouchableOpacity
            onPress={handleLogOut}
            activeOpacity={0.7}
            className="flex-row items-center px-5 h-14"
          >
            <Text style={{ fontSize: 15, color: '#ef4444' }}>Log Out</Text>
          </TouchableOpacity>

          <View className="h-px bg-[#f1f5f9] mx-5" />

          <TouchableOpacity
            onPress={() => setDeleteSheetVisible(true)}
            activeOpacity={0.7}
            className="flex-row items-center px-5 h-14"
          >
            <Text style={{ fontSize: 15, color: '#ef4444' }}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* App section */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>
          APP
        </Text>
        <View
          className="bg-white rounded-2xl overflow-hidden mb-8"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
        >
          <View className="flex-row items-center px-5 h-14">
            <Text style={{ fontSize: 15, color: '#0f172a', flex: 1 }}>Version</Text>
            <Text style={{ fontSize: 15, color: '#94a3b8' }}>{appVersion}</Text>
          </View>
        </View>

        {/* Legal section */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }}>
          LEGAL
        </Text>
        <View
          className="bg-white rounded-2xl overflow-hidden"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
        >
          <TouchableOpacity
            onPress={() => router.push('/(auth)/privacy')}
            activeOpacity={0.7}
            className="flex-row items-center px-5 h-14"
          >
            <Text style={{ fontSize: 15, color: '#0f172a', flex: 1 }}>Privacy Policy</Text>
            <Text style={{ fontSize: 15, color: '#cbd5e1' }}>›</Text>
          </TouchableOpacity>

          <View className="h-px bg-[#f1f5f9] mx-5" />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/terms')}
            activeOpacity={0.7}
            className="flex-row items-center px-5 h-14"
          >
            <Text style={{ fontSize: 15, color: '#0f172a', flex: 1 }}>Terms of Service</Text>
            <Text style={{ fontSize: 15, color: '#cbd5e1' }}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <EditDisplayNameSheet
        visible={editSheetVisible}
        onClose={() => setEditSheetVisible(false)}
        currentName={userName ?? ''}
        onConfirm={handleConfirmName}
      />

      <DeleteAccountSheet
        visible={deleteSheetVisible}
        onClose={() => setDeleteSheetVisible(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteAccount.isPending}
      />
    </SafeAreaView>
  );
}
