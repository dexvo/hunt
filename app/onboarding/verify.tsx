import React, { useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text, Button } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/auth.store';
import { supabase } from '@/src/lib/supabase';

type Step = 'intro' | 'camera' | 'preview' | 'submitted';

export default function OnboardingVerify() {
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('intro');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setStep('preview');
      }
    } catch {
      Alert.alert('Error', 'Could not take photo. Try again.');
    }
  };

  const handleSubmit = async () => {
    if (!photoUri || !user) return;
    setSubmitting(true);
    try {
      // Upload selfie to private bucket
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const path = `verification/${user.id}/selfie.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('verification-media')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Mark profile as pending verification
      await supabase
        .from('profiles')
        .update({ verification_status: 'pending', verification_selfie: path })
        .eq('id', user.id);

      setStep('submitted');
    } catch {
      Alert.alert('Error', 'Could not submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'intro') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.step}>2 of 4</Text>
          <Text variant="h2">Verify it's you</Text>
          <Text variant="sm" style={styles.desc}>
            LYNX is real people only. Take a quick selfie — our team reviews every profile before it goes live.
          </Text>

          <View style={styles.rules}>
            {[
              'Face clearly visible, no sunglasses',
              'Good lighting, no filters',
              'Just you — no group photos',
            ].map((r) => (
              <View key={r} style={styles.rule}>
                <Text style={styles.ruleDot}>◆</Text>
                <Text style={styles.ruleText}>{r}</Text>
              </View>
            ))}
          </View>

          <Button
            label="Take selfie"
            variant="primary"
            fullWidth
            onPress={async () => {
              if (!permission?.granted) {
                const result = await requestPermission();
                if (!result.granted) {
                  Alert.alert('Camera required', 'LYNX needs camera access to verify your identity.');
                  return;
                }
              }
              setStep('camera');
            }}
            style={{ marginTop: Spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'camera') {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front">
          {/* Oval face guide */}
          <View style={styles.overlay}>
            <View style={styles.faceGuide} />
            <Text style={styles.cameraHint}>Position your face in the oval</Text>
          </View>
        </CameraView>
        <View style={styles.cameraBottom}>
          <TouchableOpacity onPress={() => setStep('intro')} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleTakePhoto} style={styles.shutterBtn}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          <View style={{ width: 60 }} />
        </View>
      </View>
    );
  }

  if (step === 'preview') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.step}>2 of 4</Text>
          <Text variant="h2">Looks good?</Text>
          <Text variant="sm" style={styles.desc}>Make sure your face is clear and well lit.</Text>

          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" />
          )}

          <View style={styles.previewBtns}>
            <Button label="Retake" variant="ghost" style={{ flex: 1 }} onPress={() => setStep('camera')} />
            <Button label={submitting ? 'Submitting…' : 'Submit'} variant="primary" style={{ flex: 1 }} loading={submitting} onPress={handleSubmit} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Submitted
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.inner, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
        <View style={styles.mark}>
          <View style={styles.markOuter}><View style={styles.markInner} /></View>
        </View>
        <Text variant="h2" style={{ textAlign: 'center' }}>You're in the queue</Text>
        <Text variant="sm" style={[styles.desc, { textAlign: 'center' }]}>
          We review every profile manually. You'll be notified within 24 hours once approved.
        </Text>
        <Button
          label="Continue setup"
          variant="primary"
          fullWidth
          onPress={() => router.push('/onboarding/intent')}
          style={{ marginTop: Spacing.xl }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, padding: Spacing.xl },
  step: { fontSize: Typography.xs, color: Colors.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  desc: { marginTop: Spacing.sm, marginBottom: Spacing.xl, lineHeight: 20 },
  rules: { gap: Spacing.md },
  rule: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  ruleDot: { fontSize: 8, color: Colors.accent, marginTop: 4 },
  ruleText: { fontSize: Typography.base, color: Colors.ice2, flex: 1 },
  cameraContainer: { flex: 1, backgroundColor: Colors.bg },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  faceGuide: { width: 220, height: 280, borderRadius: 110, borderWidth: 2, borderColor: Colors.accent, borderStyle: 'dashed' },
  cameraHint: { fontSize: Typography.sm, color: Colors.ice, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full },
  cameraBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl, backgroundColor: Colors.bg },
  cancelBtn: { width: 60, alignItems: 'center' },
  cancelText: { fontSize: Typography.sm, color: Colors.ice3 },
  shutterBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.ice },
  preview: { width: '100%', aspectRatio: 0.75, borderRadius: Radius.lg, marginBottom: Spacing.xl },
  previewBtns: { flexDirection: 'row', gap: Spacing.md },
  mark: { marginBottom: Spacing.xl },
  markOuter: { width: 48, height: 48, borderWidth: 1, borderColor: Colors.accent, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' },
  markInner: { width: 26, height: 26, borderWidth: 0.5, borderColor: Colors.accentBorder },
});
