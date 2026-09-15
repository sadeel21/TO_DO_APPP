/**
 * React concept: file-based routing — src/app/achievements.js → "/achievements"
 *
 * Badges are computed in ProgressContext; this screen only maps them.
 */
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import AchievementBadge from '@/components/AchievementBadge';
import ScreenHeader from '@/components/ScreenHeader';
import { useProgress } from '@/context/ProgressContext';
import { useTheme } from '@/context/ThemeContext';

export default function AchievementsScreen() {
  const { colors, isDark } = useTheme();
  const { achievements } = useProgress();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Achievements" />
        <Text style={[styles.intro, { color: colors.muted }]}>
          Badges unlock from streaks, completed tasks, early mornings, and dhikr goals.
        </Text>
        {achievements.map((item) => (
          <AchievementBadge key={item.id} achievement={item} />
        ))}
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
    gap: 12,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});
