/**
 * React concepts: controlled input (useState) + Context for persistence
 *
 * First launch: name is required; photo is optional via expo-image-picker.
 */
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProfileAvatar from '@/components/ProfileAvatar';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { pickProfileImage, promptProfileImage } from '@/utils/pickProfileImage';

export default function NameEntry() {
  const { colors, isDark } = useTheme();
  const { saveName, photoUri, savePhoto, error } = useUser();
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const visibleError = localError || error;

  async function submit() {
    const trimmed = draft.trim();
    if (!trimmed || submitting) {
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    console.log('[onboarding] NameEntry submit start');
    try {
      const ok = await saveName(trimmed);
      console.log('[onboarding] NameEntry submit result', { ok });
      if (!ok) {
        console.warn('[onboarding] NameEntry submit did not succeed');
      }
    } catch (err) {
      console.error('[onboarding] NameEntry submit threw', err);
      setLocalError(err.message || 'Could not save your name. Check that the server is running.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.glow, { backgroundColor: colors.backgroundGlow }]} />
      <View style={styles.inner}>
        <ProfileAvatar
          name={draft}
          uri={photoUri}
          size={104}
          onPress={() => promptProfileImage(savePhoto)}
        />
        <Text style={[styles.photoHint, { color: colors.muted }]}>Tap to add a photo</Text>
        <View style={styles.photoRow}>
          <Pressable
            onPress={async () => {
              const uri = await pickProfileImage('library');
              if (uri) {
                savePhoto(uri);
              }
            }}
            style={[styles.photoBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.photoBtnLabel, { color: colors.text }]}>Gallery</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              const uri = await pickProfileImage('camera');
              if (uri) {
                savePhoto(uri);
              }
            }}
            style={[styles.photoBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.photoBtnLabel, { color: colors.text }]}>Camera</Text>
          </Pressable>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>What’s your name?</Text>
        <Text style={[styles.help, { color: colors.muted }]}>
          We’ll greet you with it every time you open the app.
        </Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
          autoFocus
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={submit}
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          onPress={submit}
          disabled={submitting || !draft.trim()}
          style={[
            styles.button,
            { backgroundColor: colors.accent, opacity: draft.trim() && !submitting ? 1 : 0.5 },
          ]}>
          {submitting ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={[styles.buttonLabel, { color: colors.accentText }]}>Continue</Text>
          )}
        </Pressable>
        {visibleError ? (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{visibleError}</Text>
            <Pressable onPress={submit} disabled={submitting}>
              <Text style={[styles.errorRetry, { color: colors.accent }]}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.7,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: 12,
    alignItems: 'center',
  },
  photoHint: {
    fontSize: 13,
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  photoBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  photoBtnLabel: {
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  help: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    width: '100%',
  },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '800',
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  errorRetry: {
    fontSize: 14,
    fontWeight: '800',
  },
});
