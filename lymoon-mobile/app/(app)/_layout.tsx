import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/CustomTabBar';
import { ToastProvider } from '@/providers/ToastProvider';

export default function AppLayout() {
  return (
    <ToastProvider>
      <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="calendar" />
        <Tabs.Screen name="settings" />
        <Tabs.Screen name="schedule-created" options={{ tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="create-schedule" options={{ tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="schedule" options={{ tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="notifications" />
      </Tabs>
    </ToastProvider>
  );
}
