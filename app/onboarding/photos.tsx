import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text, Button } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/auth.store';
import { storageApi, profileApi } from '@/src/lib/api';

export default function OnboardingPhotos() {
  const { user } = useAuthStore();
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0] && user) {
      setUploading(true);
      try {
        const url = await storageApi.uploadPhoto(user.id, result.assets[0].uri, `${Date.now()}.jpg`);
        setPhotos((prev) => [...prev, url]);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleContinue = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await profileApi.update(user.id, { photos, onboarding_step: 2 });
      router.push('/onboarding/about');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    await profileApi.update(user.id, { onboarding_step: 2 }).catch(() => null);
    router.push('/onboarding/about');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.step}>Step 1 of 3</Text>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          </View>
          <Text variant="h2">Add photos</Text>
          <Text variant="sm" style={{ marginTop: Spacing.sm }}>At least one clear face photo required.</Text>
        </View>
        <View style={styles.grid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity key={i} style={styles.slot} onPress={pickPhoto} activeOpacity={0.8}>
              {photos[i]
                ? <Image source={{ uri: photos[i] }} style={StyleSheet.absoluteFill} contentFit="cover" />
                : <Text style={styles.plus}>+</Text>}
            </TouchableOpacity>
          ))}
        </View>
        <Button
          label={uploading ? 'Uploading…' : saving ? 'Saving…' : 'Continue'}
          variant="primary"
          fullWidth
          disabled={photos.length === 0 || uploading || saving}
          loading={uploading || saving}
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, padding: Spacing.xl, gap: Spacing.xl },
  header: { gap: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  step: { fontSize: Typography.xs, color: Colors.accent, letterSpacing: 2, textTransform: 'uppercase' },
  skip: { fontSize: Typography.sm, color: Colors.ice3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { width: '31%', aspectRatio: 0.75, backgroundColor: Colors.surface2, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 28, color: Colors.ice3 },
});
