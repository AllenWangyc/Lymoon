import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { CustomTabBar } from '@/components/CustomTabBar';
import { ToastProvider } from '@/providers/ToastProvider';
import { useAuthStore } from '@/stores/authStore';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [hasHydrated, isAuthenticated]);

  return (
    <ToastProvider>
      <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="calendar" />
        <Tabs.Screen name="settings" />
        <Tabs.Screen name="schedule-created" options={{ tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="create-schedule" options={{ tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="notifications" />
      </Tabs>
    </ToastProvider>
  );
}
