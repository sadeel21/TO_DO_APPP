/**
 * React concepts:
 * - time-based conditional rendering (morning / afternoon / evening)
 * - reading name, photo, tasks, streak, and XP from Context
 * - expo-router navigation to the task list
 *
 * Layout uses an 8px spacing scale (8 / 16 / 24 / 32) so sections do not overlap.
 * Motion uses Reanimated (staggered entrance, press scale) — no logic changes.
 */
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import FadeSlideIn from '@/components/FadeSlideIn';
import LevelProgress from '@/components/LevelProgress';
import PressScale from '@/components/PressScale';
import ProfileAvatar from '@/components/ProfileAvatar';
import QuickStatsCard from '@/components/QuickStatsCard';
import StreakDisplay from '@/components/StreakDisplay';
import { useDhikr } from '@/context/DhikrContext';
import { useProgress } from '@/context/ProgressContext';
import { useStreak } from '@/context/StreakContext';
import { useTasks } from '@/context/TaskContext';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { colorAlpha } from '@/utils/colorAlpha';
import { timeOfDayGreeting, todaysTaskStats } from '@/utils/greeting';
import { toDayKey } from '@/utils/streakLogic';

const SPACE = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
};

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { name, photoUri } = useUser();
  const { tasks, loading, error, reload } = useTasks();
  const { current, longest, activeDates } = useStreak();
  const dhikr = useDhikr();
  const { level, xpIntoLevel, xpToNext, percent } = useProgress();
  const today = toDayKey();
  const { remaining } = todaysTaskStats(tasks, today);
  const dhikrTotal = Object.values(dhikr.counts || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const dhikrGoal = Object.values(dhikr.goals || {}).reduce((sum, value) => sum + (Number(value) || 0), 0) || 1;
  const greeting = timeOfDayGreeting();
  const [wave, setWave] = useState(1);
  const skipFocusReplay = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (skipFocusReplay.current) {
        skipFocusReplay.current = false;
        return;
      }
      setWave((n) => n + 1);
    }, [])
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View pointerEvents="none" style={styles.glowWrap}>
        <LinearGradient
          colors={[
            colorAlpha(colors.backgroundGlow, 0.55),
            colorAlpha(colors.backgroundGlow, 0.16),
            colorAlpha(colors.background, 0),
          ]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.15, y: 1 }}
          style={styles.glowWash}
        />
        <View
          style={[
            styles.glowOrb,
            styles.glowOrbOuter,
            { backgroundColor: colorAlpha(colors.backgroundGlow, isDark ? 0.28 : 0.42) },
          ]}
        />
        <View
          style={[
            styles.glowOrb,
            styles.glowOrbInner,
            { backgroundColor: colorAlpha(colors.accent, isDark ? 0.18 : 0.22) },
          ]}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <FadeSlideIn wave={wave} delay={0} duration={340}>
            <View style={styles.topBar}>
              <View style={styles.greetingBlock}>
                <ProfileAvatar name={name} uri={photoUri} size={56} />
                <View style={styles.greetingCopy}>
                  <Text style={[styles.helloKicker, { color: colors.muted }]} numberOfLines={1}>
                    {greeting}
                  </Text>
                  <Text style={[styles.hello, { color: colors.text }]} numberOfLines={1}>
                    {name} 👋
                  </Text>
                </View>
              </View>
              <PressScale
                accessibilityRole="button"
                accessibilityLabel="Open settings"
                onPress={() => router.push('/settings')}
                hitSlop={8}
                style={[
                  styles.settingsBtn,
                  { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow },
                ]}>
                <Text style={styles.settingsIcon}>⚙️</Text>
              </PressScale>
            </View>
          </FadeSlideIn>

          <FadeSlideIn wave={wave} delay={80} duration={320} style={styles.section}>
            <StreakDisplay
              compact
              current={current}
              longest={longest}
              activeDates={activeDates}
              style={styles.streakChip}
              onPress={() => router.push('/streak')}
            />
          </FadeSlideIn>

          <View style={styles.statsRow}>
            <FadeSlideIn wave={wave} delay={160} duration={300} style={styles.statEnter}>
              <QuickStatsCard
                tint="tasks"
                icon="✓"
                label="Tasks Today"
                value={`${remaining} left`}
                onPress={() => router.push('/tasks')}
              />
            </FadeSlideIn>
            <FadeSlideIn wave={wave} delay={220} duration={300} style={styles.statEnter}>
              <QuickStatsCard
                tint="dhikr"
                icon="📿"
                label="Dhikr"
                value={`${dhikrTotal}/${dhikrGoal}`}
                onPress={() => router.push('/dhikr')}
              />
            </FadeSlideIn>
            <FadeSlideIn wave={wave} delay={280} duration={300} style={styles.statEnter}>
              <QuickStatsCard
                tint="streak"
                icon="🔥"
                label="Streak"
                value={`${current} day${current === 1 ? '' : 's'} 🔥`}
                onPress={() => router.push('/streak')}
              />
            </FadeSlideIn>
          </View>

          <FadeSlideIn wave={wave} delay={360} duration={340}>
            <View style={[styles.divider, { backgroundColor: colors.accentSoft }]} />
            <View style={styles.levelSection}>
              <LevelProgress
                animateFill
                replayKey={wave}
                level={level}
                xpIntoLevel={xpIntoLevel}
                xpToNext={xpToNext}
                percent={percent}
              />
              {loading ? <ActivityIndicator color={colors.accent} style={styles.status} /> : null}
              {error ? (
                <Pressable onPress={reload} style={styles.status}>
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error} · Retry</Text>
                </Pressable>
              ) : null}
            </View>
          </FadeSlideIn>

          <FadeSlideIn wave={wave} delay={440} duration={360} style={styles.actions}>
            <PressScale
              accessibilityRole="button"
              accessibilityLabel="View tasks"
              onPress={() => router.push('/tasks')}
              pressStyle={styles.ctaPress}
              style={[styles.cta, { shadowColor: colors.accent }]}>
              <LinearGradient
                colors={[colors.accent, colorAlpha(colors.accent, 0.82)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[styles.ctaLabel, { color: colors.accentText }]}>View Tasks</Text>
            </PressScale>
            <View style={styles.secondaryRow}>
              <PressScale
                accessibilityRole="link"
                onPress={() => router.push('/dhikr')}
                pressStyle={styles.ghostPress}
                style={[
                  styles.ghost,
                  { borderColor: colors.accent, backgroundColor: colors.accentSoft, shadowColor: colors.shadow },
                ]}>
                <Text style={[styles.ghostLabel, { color: colors.text }]}>Dhikr</Text>
              </PressScale>
              <PressScale
                accessibilityRole="link"
                onPress={() => router.push('/achievements')}
                pressStyle={styles.ghostPress}
                style={[
                  styles.ghost,
                  { borderColor: colors.accent, backgroundColor: colors.accentSoft, shadowColor: colors.shadow },
                ]}>
                <Text style={[styles.ghostLabel, { color: colors.text }]}>Badges</Text>
              </PressScale>
            </View>
          </FadeSlideIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  glowWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '78%',
    height: 280,
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowOrbOuter: {
    top: -90,
    right: -70,
    width: 260,
    height: 260,
  },
  glowOrbInner: {
    top: -40,
    right: -20,
    width: 140,
    height: 140,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.lg,
  },
  content: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: SPACE.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.sm,
    minHeight: 56,
  },
  greetingBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    minWidth: 0,
  },
  greetingCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  helloKicker: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  hello: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  settingsIcon: {
    fontSize: 18,
  },
  section: {
    width: '100%',
    gap: SPACE.xs,
  },
  streakChip: {
    marginTop: 0,
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SPACE.xs,
    width: '100%',
  },
  statEnter: {
    flex: 1,
    minWidth: 0,
  },
  divider: {
    height: 2,
    borderRadius: 999,
    width: '100%',
    marginBottom: SPACE.md,
    opacity: 0.9,
  },
  levelSection: {
    width: '100%',
    gap: SPACE.xs,
  },
  status: {
    marginTop: SPACE.xs,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: SPACE.sm,
    paddingTop: SPACE.xs,
  },
  ctaPress: {
    width: '100%',
  },
  cta: {
    overflow: 'hidden',
    borderRadius: 20,
    paddingVertical: SPACE.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaLabel: {
    position: 'relative',
    zIndex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  ghostPress: {
    flex: 1,
  },
  ghost: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  ghostLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
