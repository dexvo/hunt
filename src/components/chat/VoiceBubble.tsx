import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import { Colors, Radius, Typography } from '@/src/constants/tokens';
import { Text } from '@/src/components/ui';
import { formatVoiceDuration } from '@/src/utils/helpers';
import type { Message } from '@/src/types';

interface VoiceBubbleProps {
  message: Message;
  isMine: boolean;
}

const BARS = [4, 8, 12, 6, 16, 10, 8, 14, 6, 10, 8, 12, 16, 4, 8, 10, 6, 14, 8, 12, 4, 10];

export const VoiceBubble = ({ message, isMine }: VoiceBubbleProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const [currentSecs, setCurrentSecs] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const totalSecs = message.duration_secs || 0;

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        // Pause
        await soundRef.current?.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (soundRef.current) {
        // Resume
        await soundRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      // Load and play fresh
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri: message.content },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          const pos = status.positionMillis || 0;
          const dur = status.durationMillis || (totalSecs * 1000) || 1;
          setProgress(pos / dur);
          setCurrentSecs(Math.round(pos / 1000));
          if (status.didJustFinish) {
            setIsPlaying(false);
            setProgress(0);
            setCurrentSecs(0);
            soundRef.current?.unloadAsync();
            soundRef.current = null;
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (e) {
      console.error('Voice playback error:', e);
    }
  };

  const displaySecs = isPlaying ? currentSecs : totalSecs;

  return (
    <View style={[styles.container, isMine && styles.containerMine]}>
      <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn} activeOpacity={0.8}>
        <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>

      {/* Waveform */}
      <View style={styles.wave}>
        {BARS.map((h, i) => {
          const filled = progress > 0 && i / BARS.length <= progress;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                { height: h },
                filled ? styles.barFilled : styles.barEmpty,
              ]}
            />
          );
        })}
      </View>

      <Text style={styles.duration}>{formatVoiceDuration(displaySecs)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: Radius.sm,
    maxWidth: 240,
    minWidth: 180,
  },
  containerMine: {
    backgroundColor: Colors.accentBg,
    borderColor: Colors.accentBorder,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.sm,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  playIcon: { fontSize: 10, color: Colors.white },
  wave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bar: { width: 2, borderRadius: 1 },
  barFilled: { backgroundColor: Colors.accent, opacity: 1 },
  barEmpty: { backgroundColor: Colors.ice3, opacity: 0.35 },
  duration: { fontSize: 9, fontWeight: Typography.regular, color: Colors.ice3, flexShrink: 0 },
});
