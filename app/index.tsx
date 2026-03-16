import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';

export default function Index() {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return null;
  return <Redirect href={user ? '/tabs' : '/auth/splash'} />;
}
