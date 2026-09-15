/**
 * React concepts:
 * - time-based conditional rendering (morning / afternoon / evening)
 * - reading name, photo, tasks, streak, and XP from Context
 * - expo-router navigation to the task list
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import LevelProgress from '@/components/LevelProgress';
import ProfileAvatar from '@/components/ProfileAvatar';
import StreakDisplay from '@/components/StreakDisplay';
import { useProgress } from '@/context/ProgressContext';
import { useStreak } from '@/context/StreakContext';
import { useTasks } from '@/context/TaskContext';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { remainingTodayCopy, timeOfDayGreeting } from '@/utils/greeting';
import { toDayKey } from '@/utils/streakLogic';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { name, photoUri } = useUser();
  const { tasks, loading, error, reload } = useTasks();
  const { current, longest, activeDates } = useStreak();
  const { level, xpIntoLevel, xpToNext, percent } = useProgress();
  const today = toDayKey();

  const remainingToday = tasks.filter((task) => {
    if (task.completed) {
      return false;
    }
    if (!task.dueDate) {
      return true;
    }
    return task.dueDate <= today;
  }).length;

  const greeting = timeOfDayGreeting();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.glow, { backgroundColor: colors.backgroundGlow }]} />
      <View style={styles.inner}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
          <ProfileAvatar name={name} uri={photoUri} size={96} />
          <Text style={[styles.hello, { color: colors.text }]}>
            {greeting}, {name} 👋
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(220)} style={styles.summary}>
          <LevelProgress
            compact
            level={level}
            xpIntoLevel={xpIntoLevel}
            xpToNext={xpToNext}
            percent={percent}
          />
          <Text style={[styles.summaryLine, { color: colors.muted }]}>
            {remainingTodayCopy(remainingToday)}
          </Text>
          {loading ? <ActivityIndicator color={colors.accent} /> : null}
          {error ? (
            <Pressable onPress={reload}>
              <Text style={[styles.summaryLine, { color: colors.danger }]}>{error} · Retry</Text>
            </Pressable>
          ) : null}
          <StreakDisplay
            compact
            current={current}
            longest={longest}
            activeDates={activeDates}
            style={{ alignSelf: 'center' }}
            onPress={() => router.push('/streak')}
          />
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(400)} style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View tasks"
            onPress={() => router.push('/tasks')}
            style={[styles.cta, { backgroundColor: colors.accent }]}>
            <Text style={[styles.ctaLabel, { color: colors.accentText }]}>View Tasks</Text>
          </Pressable>
          <View style={styles.row}>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/dhikr')}
              style={[styles.ghost, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.ghostLabel, { color: colors.text }]}>Dhikr</Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/achievements')}
              style={[styles.ghost, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.ghostLabel, { color: colors.text }]}>Badges</Text>
            </Pressable>
          </View>
        </Animated.View>
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
    top: -90,
    right: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.75,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 14,
  },
  hello: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
    lineHeight: 38,
  },
  summary: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  summaryLine: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 12,
  },
  cta: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaLabel: {
    fontSize: 17,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  ghost: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
