import { Stack } from 'expo-router';
import { Colors } from '@/src/constants/tokens';
export default function MemberLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg }, presentation: 'modal' }} />;
}
