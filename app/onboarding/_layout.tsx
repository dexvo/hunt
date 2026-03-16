import { Stack } from 'expo-router';
import { Colors } from '@/src/constants/tokens';
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg }, gestureEnabled: false }} />;
}
