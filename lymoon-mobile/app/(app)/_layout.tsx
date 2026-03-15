import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../src/components/CustomTabBar';

export default function AppLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="team" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
