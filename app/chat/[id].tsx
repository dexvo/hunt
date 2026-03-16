import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { Colors, Spacing, Typography, Radius } from '@/src/constants/tokens';
import { Text, Input } from '@/src/components/ui';
import { TextBubble, ImageBubble, DateSeparator, IcebreakerCard, IntentBanner } from '@/src/components/chat/Bubbles';
import { VoiceBubble } from '@/src/components/chat/VoiceBubble';
import { useAuthStore } from '@/src/store/auth.store';
import { useChatStore } from '@/src/store/chat.store';
import { chatApi, storageApi } from '@/src/lib/api';
import { useRealtimeMessages } from '@/src/hooks';
import { generateIcebreakers } from '@/src/utils/helpers';
import type { Message } from '@/src/types';

export default function ChatScreen() {
  const { id: conversationId, profileName } = useLocalSearchParams<{ id: string; profileName: string }>();
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage, markAsRead } = useChatStore();
  const convMessages = messages[conversationId] || [];
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(true);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!conversationId || !user) return;
    chatApi.getMessages(conversationId).then((msgs) => {
      setMessages(conversationId, msgs);
      markAsRead(conversationId, user.id);
      chatApi.markRead(conversationId, user.id);
      if (msgs.length > 1) setShowIcebreakers(false);
    });
  }, [conversationId, user]);

  useRealtimeMessages(conversationId, (msg: Message) => {
    addMessage(conversationId, msg);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  });

  const sendText = useCallback(async () => {
    if (!text.trim() || !user || !conversationId) return;
    const content = text.trim();
    setText('');
    setShowIcebreakers(false);
    setSending(true);
    try {
      const msg = await chatApi.sendMessage(conversationId, user.id, content, 'text');
      addMessage(conversationId, msg);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert('Error', 'Could not send message.');
      setText(content);
    } finally { setSending(false); }
  }, [text, user, conversationId]);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch { Alert.alert('Error', 'Could not start recording.'); }
  };

  const stopRecording = async () => {
    if (!recordingRef.current || !user || !conversationId) return;
    setIsRecording(false);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) return;
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync() as any;
      await sound.unloadAsync();
      const durationSecs = Math.round((status.durationMillis || 0) / 1000);
      const voiceUrl = await storageApi.uploadVoiceNote(conversationId, uri);
      const msg = await chatApi.sendMessage(conversationId, user.id, voiceUrl, 'voice', durationSecs);
      addMessage(conversationId, msg);
      setShowIcebreakers(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch { Alert.alert('Error', 'Could not send voice message.'); }
  };

  const icebreakers = generateIcebreakers({ interests: ['travel', 'film'], city: 'Mexico City', bio: 'Real connections' });

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
    if (item.type === 'voice') return <VoiceBubble message={item} isMine={isMine} />;
    if (item.type === 'image') return <ImageBubble message={item} isMine={isMine} />;
    return <TextBubble message={item} isMine={isMine} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{profileName}</Text>
          <Text style={styles.headerStatus}>Online · Now mode</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}><Text style={styles.iconText}>○</Text></TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={convMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            <>
              <IntentBanner name={profileName || 'Member'} mode="Now" />
              {showIcebreakers && convMessages.length === 0 && (
                <IcebreakerCard suggestions={icebreakers} onSelect={(t) => { setText(t); setShowIcebreakers(false); }} />
              )}
            </>
          }
        />

        <View style={styles.inputArea}>
          <TouchableOpacity
            style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            activeOpacity={0.8}
          >
            <Text style={styles.voiceIcon}>{isRecording ? '⏹' : '🎤'}</Text>
          </TouchableOpacity>
          <Input
            value={text}
            onChangeText={setText}
            placeholder="Write a message…"
            style={styles.textInput}
            returnKeyType="send"
            onSubmitEditing={sendText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnOff]}
            onPress={sendText}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border2 },
  backText: { fontSize: 20, color: Colors.ice3 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.ice },
  headerStatus: { fontSize: 10, color: Colors.accent, marginTop: 1 },
  iconBtn: { padding: 4 },
  iconText: { fontSize: 18, color: Colors.ice3 },
  messageList: { padding: Spacing.lg, gap: Spacing.md },
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border2, backgroundColor: Colors.surface1 },
  voiceBtn: { width: 38, height: 38, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  voiceBtnActive: { backgroundColor: Colors.accentBg, borderColor: Colors.accent },
  voiceIcon: { fontSize: 16 },
  textInput: { flex: 1, maxHeight: 100, borderRadius: Radius.md },
  sendBtn: { width: 38, height: 38, backgroundColor: Colors.accent, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { opacity: 0.4 },
  sendIcon: { fontSize: 16, color: Colors.white },
});
