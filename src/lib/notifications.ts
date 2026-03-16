import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/src/lib/supabase';

// ── CONFIGURE HANDLER ─────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── REGISTER FOR PUSH ─────────────────────────────────────
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7B8FFF',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('taps', {
      name: 'Taps',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#7B8FFF',
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    // Save token to Supabase so server can send push
    await supabase
      .from('push_tokens')
      .upsert({ user_id: userId, token, platform: Platform.OS, updated_at: new Date().toISOString() });
    return token;
  } catch (e) {
    console.error('Push token error:', e);
    return null;
  }
}

// ── LOCAL NOTIFICATION HELPERS ────────────────────────────
export async function sendLocalMessageNotification(senderName: string, preview: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: senderName,
      body: preview,
      sound: 'default',
      data: { type: 'message' },
    },
    trigger: null,
  });
}

export async function sendLocalTapNotification(senderName: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New tap',
      body: `${senderName} sent you a tap`,
      sound: 'default',
      data: { type: 'tap' },
    },
    trigger: null,
  });
}

// ── CLEAR BADGE ───────────────────────────────────────────
export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}

// ── HANDLE RESPONSE (tapped notification) ─────────────────
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

// ── REMOVE TOKEN ON LOGOUT ────────────────────────────────
export async function removePushToken(userId: string) {
  await supabase.from('push_tokens').delete().eq('user_id', userId);
}
