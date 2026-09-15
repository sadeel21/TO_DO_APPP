/**
 * React concept: file-based routing — src/app/streak.js → "/streak"
 *
 * Streak math lives in StreakContext; this screen only renders StreakDisplay.
 */
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import ScreenHeader from '@/components/ScreenHeader';
import StreakDisplay from '@/components/StreakDisplay';
import { useStreak } from '@/context/StreakContext';
import { useTheme } from '@/context/ThemeContext';

export default function StreakScreen() {
  const { colors, isDark } = useTheme();
  const { current, longest, activeDates } = useStreak();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Streak" />
        <Text style={[styles.intro, { color: colors.muted }]}>
          A day counts when you complete a task or hit at least one dhikr goal. Miss a full day and
          the current streak returns to 0.
        </Text>
        <StreakDisplay current={current} longest={longest} activeDates={activeDates} />
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
    paddingBottom: 40,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
  },
});
