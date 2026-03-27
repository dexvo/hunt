import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withSequence, withSpring, Easing, FadeIn, FadeInDown,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text, Button } from '@/src/components/ui';
import { supabase } from '@/src/lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { Profile } from '@/src/types';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

function getOnboardingRoute(profile: Profile | null): string {
  if (!profile || !profile.has_completed_onboarding) {
    const step = profile?.onboarding_step ?? 1;
    if (step <= 1) return '/onboarding/photos';
    if (step === 2) return '/onboarding/about';
    return '/onboarding/role';
  }
  return '/tabs';
}

export default function SplashScreen() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  const [animDone, setAnimDone] = useState(false);

  // Animation values
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const dotScale = useSharedValue(0);
  const crossTop = useSharedValue(0);
  const crossBottom = useSharedValue(0);
  const crossLeft = useSharedValue(0);
  const crossRight = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(12);
  const taglineOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(20);

  useEffect(() => {
    // 1. Center dot appears (0ms)
    dotScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 200 }));

    // 2. Ring expands (300ms)
    ringOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));
    ringScale.value = withDelay(300, withSpring(1, { damping: 14, stiffness: 180 }));

    // 3. Crosshair lines shoot out (500ms)
    const lineConfig = { duration: 250, easing: Easing.out(Easing.cubic) };
    crossTop.value = withDelay(500, withTiming(1, lineConfig));
    crossBottom.value = withDelay(550, withTiming(1, lineConfig));
    crossLeft.value = withDelay(600, withTiming(1, lineConfig));
    crossRight.value = withDelay(650, withTiming(1, lineConfig));

    // 4. HUNT wordmark fades in (900ms)
    logoOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));
    logoTranslateY.value = withDelay(900, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    // 5. Tagline fades in (1200ms)
    taglineOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));

    // 6. Buttons slide up (1600ms)
    buttonsOpacity.value = withDelay(1600, withTiming(1, { duration: 400 }));
    buttonsTranslateY.value = withDelay(1600, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    const timer = setTimeout(() => setAnimDone(true), 1700);
    return () => clearTimeout(timer);
  }, []);

  // Animated styles
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  const lineTopStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: crossTop.value }],
    opacity: crossTop.value,
  }));

  const lineBottomStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: crossBottom.value }],
    opacity: crossBottom.value,
  }));

  const lineLeftStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: crossLeft.value }],
    opacity: crossLeft.value,
  }));

  const lineRightStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: crossRight.value }],
    opacity: crossRight.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;
      if (!idToken) throw new Error('No ID token returned from Google.');
      const { data, error: authError } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
      if (authError) throw authError;
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
        router.replace(getOnboardingRoute(profile as Profile | null) as any);
      }
    } catch (e: any) {
      if (e?.code !== 'SIGN_IN_CANCELLED') setError('Google sign-in failed. Try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleApple = async () => {
    setError('');
    setAppleLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) throw new Error('No identity token from Apple.');
      const { data, error: authError } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
      if (authError) throw authError;
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
        router.replace(getOnboardingRoute(profile as Profile | null) as any);
      }
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') setError('Apple sign-in failed. Try again.');
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        {/* Crosshair animation */}
        <View style={styles.crosshairWrap}>
          {/* Center dot */}
          <Animated.View style={[styles.dot, dotStyle]} />

          {/* Ring */}
          <Animated.View style={[styles.ring, ringStyle]} />

          {/* Crosshair lines */}
          <Animated.View style={[styles.lineV, styles.lineTop, lineTopStyle]} />
          <Animated.View style={[styles.lineV, styles.lineBottom, lineBottomStyle]} />
          <Animated.View style={[styles.lineH, styles.lineLeft, lineLeftStyle]} />
          <Animated.View style={[styles.lineH, styles.lineRight, lineRightStyle]} />
        </View>

        {/* Logo */}
        <Animated.Text style={[styles.logo, logoStyle]}>HUNT</Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, taglineStyle]}>Not everyone gets in.</Animated.Text>
      </View>

      {/* Auth buttons */}
      <Animated.View style={[styles.bottom, buttonsStyle]}>
        <Button label="Continue with phone" variant="primary" fullWidth onPress={() => router.push('/auth/phone')} />
        <Button label={googleLoading ? 'Signing in…' : 'Continue with Google'} variant="secondary" fullWidth loading={googleLoading} onPress={handleGoogle} />
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.appleBtn} onPress={handleApple} disabled={appleLoading} activeOpacity={0.8}>
            <Text style={styles.appleBtnText}>{appleLoading ? 'Signing in…' : ' Continue with Apple'}</Text>
          </TouchableOpacity>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.legal}>By continuing you agree to our Terms and Privacy Policy.</Text>
      </Animated.View>
    </View>
  );
}

const CROSSHAIR_SIZE = 56;
const RING_SIZE = 40;
const LINE_LENGTH = 10;
const LINE_THICK = 1.5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: Spacing.xl,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },

  // Crosshair
  crosshairWrap: {
    width: CROSSHAIR_SIZE,
    height: CROSSHAIR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.accent,
    position: 'absolute',
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    position: 'absolute',
  },
  lineV: {
    width: LINE_THICK,
    height: LINE_LENGTH,
    backgroundColor: Colors.accent,
    position: 'absolute',
  },
  lineH: {
    width: LINE_LENGTH,
    height: LINE_THICK,
    backgroundColor: Colors.accent,
    position: 'absolute',
  },
  lineTop: {
    top: 0,
    transformOrigin: 'bottom',
  },
  lineBottom: {
    bottom: 0,
    transformOrigin: 'top',
  },
  lineLeft: {
    left: 0,
    top: '50%',
    marginTop: -LINE_THICK / 2,
    transformOrigin: 'right',
  },
  lineRight: {
    right: 0,
    top: '50%',
    marginTop: -LINE_THICK / 2,
    transformOrigin: 'left',
  },

  // Logo
  logo: {
    fontFamily: Typography.brand,
    fontSize: Typography['4xl'],
    letterSpacing: 8,
    color: Colors.ice,
  },

  // Tagline
  tagline: {
    fontFamily: Typography.regular,
    fontSize: Typography.sm,
    color: Colors.accent,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  // Bottom
  bottom: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  appleBtn: {
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleBtnText: {
    fontFamily: Typography.semibold,
    fontSize: Typography.base,
    color: '#000',
  },
  error: {
    fontFamily: Typography.regular,
    fontSize: Typography.sm,
    color: Colors.error,
    textAlign: 'center',
  },
  legal: {
    fontFamily: Typography.regular,
    fontSize: Typography.xs,
    color: Colors.ice3,
    textAlign: 'center',
    lineHeight: 16,
  },
});
