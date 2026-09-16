/**
 * React concept: controlled preview state + callbacks (lifting the confirmed task up)
 *
 * Mic lives beside the typed Add flow. Confirm/Cancel keep the user in control
 * of what gets saved — speech never auto-submits.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { parseVoiceDate } from '@/utils/parseVoiceDate';
import {
  describeSpeechSupport,
  startNativeListening,
  startWebListening,
} from '@/utils/speechRecognition';

export default function VoiceTaskInput({ onConfirm, priority = 'medium', category = 'personal' }) {
  const { colors } = useTheme();
  const [listening, setListening] = useState(false);
  const [preview, setPreview] = useState(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const stopRef = useRef(null);

  useEffect(() => {
    if (!listening) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

  useEffect(
    () => () => {
      stopRef.current?.();
    },
    []
  );

  function openPreview(raw) {
    const parsed = parseVoiceDate(raw);
    if (!parsed.text.trim()) {
      setError('No speech detected. Try again.');
      return;
    }
    setPreview(parsed);
    setDraft(parsed.text);
    setError(null);
  }

  async function startListening() {
    // Expo Go / native: keep the mic visible but don't start recognition or show errors.
    if (Platform.OS !== 'web') {
      return;
    }

    const support = describeSpeechSupport();
    if (!support.ok) {
      setError(support.message);
      return;
    }

    setError(null);
    setPreview(null);
    setListening(true);

    const handlers = {
      onPartial: () => {},
      onFinal: (text) => {
        stopRef.current?.();
        stopRef.current = null;
        setListening(false);
        openPreview(text);
      },
      onError: (message) => {
        setError(message);
        setListening(false);
      },
      onEnd: () => setListening(false),
    };

    const stop =
      support.backend === 'web'
        ? startWebListening(handlers)
        : await startNativeListening(handlers);
    stopRef.current = stop;
  }

  function cancelListen() {
    stopRef.current?.();
    stopRef.current = null;
    setListening(false);
  }

  function confirmPreview() {
    const text = draft.trim();
    if (!text) {
      setError('Enter a task name before confirming.');
      return;
    }
    onConfirm({
      text,
      dueDate: preview?.dueDate || null,
      priority,
      category,
    });
    setPreview(null);
    setDraft('');
    setError(null);
  }

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale: listening ? pulse : 1 }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Stop listening' : 'Add task by voice'}
          onPress={listening ? cancelListen : startListening}
          style={[
            styles.mic,
            {
              backgroundColor: listening ? colors.dangerSoft : colors.accentSoft,
              borderColor: listening ? colors.danger : colors.border,
            },
          ]}>
          <Text style={[styles.micLabel, { color: listening ? colors.danger : colors.accent }]}>
            {listening ? '●' : '🎤'}
          </Text>
        </Pressable>
      </Animated.View>

      {listening ? (
        <Text style={[styles.status, { color: colors.accent }]}>Listening...</Text>
      ) : null}

      {Platform.OS === 'web' && error ? (
        <Text style={[styles.status, { color: colors.danger }]}>{error}</Text>
      ) : null}

      {preview ? (
        <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.previewKicker, { color: colors.muted }]}>Voice draft</Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            style={[
              styles.previewInput,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
          <Text style={[styles.dueHint, { color: colors.muted }]}>
            {preview.dueDate ? `Due ${preview.dueDate}` : 'No due date detected'}
          </Text>
          <View style={styles.previewActions}>
            <Pressable onPress={() => setPreview(null)} style={styles.previewBtn}>
              <Text style={[styles.previewBtnLabel, { color: colors.muted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirmPreview}
              style={[styles.previewBtn, { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 12 }]}>
              <Text style={[styles.previewBtnLabel, { color: colors.accentText }]}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mic: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micLabel: {
    fontSize: 18,
    fontWeight: '800',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    maxWidth: 88,
    textAlign: 'center',
  },
  preview: {
    position: 'absolute',
    top: 56,
    right: 0,
    width: 280,
    zIndex: 20,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    elevation: 6,
  },
  previewKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  previewInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  dueHint: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  previewBtn: {
    paddingVertical: 8,
  },
  previewBtnLabel: {
    fontWeight: '800',
    fontSize: 14,
  },
});
