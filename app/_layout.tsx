import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthSession, useOnlinePresence, useLocation } from '@/src/hooks';
import { configureRevenueCat, identifyUser } from '@/src/lib/purchases';
import { registerForPushNotifications, addNotificationResponseListener } from '@/src/lib/notifications';
import { useAuthStore } from '@/src/store/auth.store';
import { useSubStore } from '@/src/store/sub.store';
import { Colors } from '@/src/constants/tokens';

SplashScreen.preventAutoHideAsync();

try { configureRevenueCat(); } catch (e) { console.warn('RevenueCat:', e); }

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30_000 } },
});

function AppProviders({ children }: { children: React.ReactNode }) {
  useAuthSession();
  useOnlinePresence();
  useLocation();

  const { user } = useAuthStore();
  const { refresh, startListening } = useSubStore();

  useEffect(() => {
    if (!user?.id) return;
    identifyUser(user.id);
    refresh();
    registerForPushNotifications(user.id).catch(console.error);
    const unsub = startListening();
    return unsub;
  }, [user?.id]);

  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'message' && data?.conversationId) {
        router.push(`/chat/${data.conversationId}`);
      }
    });
    return () => sub.remove();
  }, []);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'DMSans-Bold':      require('../assets/fonts/DMSans-Bold.ttf'),
    'DMSans-SemiBold':  require('../assets/fonts/DMSans-SemiBold.ttf'),
    'Inter-Light':      require('../assets/fonts/Inter-Light.ttf'),
    'Inter-Regular':    require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium':     require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold':   require('../assets/fonts/Inter-SemiBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProviders>
          <StatusBar style="light" backgroundColor={Colors.bg} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
            <Stack.Screen name="auth"        options={{ headerShown: false }} />
            <Stack.Screen name="onboarding"  options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="tabs"        options={{ headerShown: false }} />
            <Stack.Screen name="paywall"     options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="member/[id]" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="chat/[id]"   options={{ headerShown: false, animation: 'slide_from_right' }} />
          </Stack>
        </AppProviders>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
