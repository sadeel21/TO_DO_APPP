/**
 * React concept: file-based routing — src/app/settings.tsx → "/settings"
 *
 * Theme toggle lives here (not on the list) so appearance is an app setting.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import Card from '@/components/Card';
import ProfileAvatar from '@/components/ProfileAvatar';
import ScreenHeader from '@/components/ScreenHeader';
import { useProgress } from '@/context/ProgressContext';
import { useTasks } from '@/context/TaskContext';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { pickProfileImage, promptProfileImage } from '@/utils/pickProfileImage';

export default function SettingsScreen() {
  const { colors, isDark, mode, setThemeMode } = useTheme();
  const { tasks, completedThisWeek } = useTasks();
  const { name, photoUri, saveName, savePhoto } = useUser();
  const { level, totalXp } = useProgress();
  const [nameDraft, setNameDraft] = useState(name);
  const remaining = tasks.filter((task) => !task.completed).length;

  useEffect(() => {
    setNameDraft(name);
  }, [name]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Settings" />

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>PROFILE</Text>
          <View style={styles.profileRow}>
            <ProfileAvatar
              name={name}
              uri={photoUri}
              size={72}
              onPress={() => promptProfileImage(savePhoto)}
            />
            <View style={styles.profileCopy}>
              <Text style={[styles.label, { color: colors.text }]}>{name || 'Your name'}</Text>
              <Text style={[styles.help, { color: colors.muted }]}>
                Level {level} · {totalXp} XP
              </Text>
            </View>
          </View>
          <View style={styles.photoRow}>
            <Pressable
              onPress={async () => {
                const uri = await pickProfileImage('library');
                if (uri) {
                  savePhoto(uri);
                }
              }}
              style={[styles.photoBtn, { borderColor: colors.border }]}>
              <Text style={[styles.actionLabel, { color: colors.accent }]}>Gallery</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                const uri = await pickProfileImage('camera');
                if (uri) {
                  savePhoto(uri);
                }
              }}
              style={[styles.photoBtn, { borderColor: colors.border }]}>
              <Text style={[styles.actionLabel, { color: colors.accent }]}>Camera</Text>
            </Pressable>
          </View>
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
          <Pressable
            onPress={() => saveName(nameDraft)}
            style={[styles.saveName, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.actionLabel, { color: colors.accent }]}>Save name</Text>
          </Pressable>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>APPEARANCE</Text>
          <Text style={[styles.label, { color: colors.text }]}>Theme</Text>
          <Text style={[styles.help, { color: colors.muted }]}>
            {mode === 'auto'
              ? 'Auto: dark after 6:30 PM, light after 6:30 AM'
              : isDark
                ? 'Dark plum palette'
                : 'Soft lilac palette'}
          </Text>
          <View style={styles.segment}>
            {['light', 'dark', 'auto'].map((option) => {
              const selected = mode === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setThemeMode(option)}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor: selected ? colors.accent : 'transparent',
                      borderColor: colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.segmentLabel,
                      { color: selected ? colors.accentText : colors.text },
                    ]}>
                    {option === 'light' ? 'Light' : option === 'dark' ? 'Dark' : 'Auto'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>STATS</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.help, { color: colors.muted }]}>Total tasks</Text>
            <Text style={[styles.label, { color: colors.text }]}>{tasks.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.help, { color: colors.muted }]}>Still open</Text>
            <Text style={[styles.label, { color: colors.text }]}>{remaining}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.help, { color: colors.muted }]}>Completed this week</Text>
            <Text style={[styles.label, { color: colors.text }]}>{completedThisWeek}</Text>
          </View>
          <Pressable onPress={() => router.push('/achievements')} style={styles.infoRow}>
            <Text style={[styles.help, { color: colors.muted }]}>Achievements</Text>
            <Text style={[styles.actionLabel, { color: colors.accent }]}>View</Text>
          </Pressable>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>ABOUT</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.help, { color: colors.muted }]}>Name</Text>
            <Text style={[styles.label, { color: colors.text }]}>To-Do</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.help, { color: colors.muted }]}>Version</Text>
            <Text style={[styles.label, { color: colors.text }]}>1.0.0</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    gap: 12,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  help: {
    fontSize: 13,
    marginTop: 2,
  },
  toggle: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toggleLabel: {
    fontWeight: '800',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileCopy: {
    flex: 1,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photoBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveName: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
});
