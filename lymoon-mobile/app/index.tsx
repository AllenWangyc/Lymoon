import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // Wait for the persisted store to load from SecureStore before routing.
  // Without this guard, the app would always redirect to login on cold start.
  if (!hasHydrated) return null;

  return <Redirect href={isAuthenticated ? '/(app)/' : '/(auth)/login'} />;
}
