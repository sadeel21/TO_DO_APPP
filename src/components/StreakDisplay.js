/**
 * React concept: presentational component (props in, no persistence here)
 *
 * compact = header chip. Full mode = stats + 30-day calendar.
 */
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import Card from '@/components/Card';
import PressScale from '@/components/PressScale';
import { useTheme } from '@/context/ThemeContext';
import { colorAlpha } from '@/utils/colorAlpha';
import { dayNumber, lastNDayKeys, toDayKey, weekdayIndex } from '@/utils/streakLogic';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function BreathingFlame({ active }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.14, { duration: 920 }), withTiming(1, { duration: 920 })),
        -1,
        false
      );
    } else {
      pulse.value = 1;
    }
  }, [active, pulse]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return <Animated.Text style={[styles.flame, style]}>🔥</Animated.Text>;
}

export default function StreakDisplay({
  compact = false,
  current = 0,
  longest = 0,
  activeDates = {},
  onPress,
  style,
}) {
  const { colors } = useTheme();
  const today = toDayKey();
  const days = lastNDayKeys(30);
  const leadingBlanks = weekdayIndex(days[0]);
  const label = current === 1 ? '1 day streak' : `${current} day streak`;

  if (compact) {
    const chipBody = (
      <>
        <LinearGradient
          colors={[colors.accent, colors.accentSoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <BreathingFlame active={current > 0} />
        <Text style={[styles.chipLabel, { color: colors.accentText }]}>{label}</Text>
      </>
    );

    const chipStyle = [
      styles.chip,
      { borderColor: colorAlpha(colors.accent, 0.35), shadowColor: colors.accent },
      style,
    ];

    if (onPress) {
      return (
        <PressScale
          accessibilityRole="link"
          accessibilityLabel={label}
          onPress={onPress}
          style={chipStyle}>
          {chipBody}
        </PressScale>
      );
    }

    return <View style={chipStyle}>{chipBody}</View>;
  }

  return (
    <View style={styles.stack}>
      <Card style={styles.hero}>
        <Text style={styles.heroFlame}>🔥</Text>
        <Text style={[styles.heroCount, { color: colors.text }]}>{current}</Text>
        <Text style={[styles.heroCaption, { color: colors.muted }]}>current streak</Text>
        <Text style={[styles.longest, { color: colors.accent }]}>
          Longest: {longest} {longest === 1 ? 'day' : 'days'}
        </Text>
      </Card>

      <Card style={styles.calendarCard}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>Last 30 days</Text>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((day, index) => (
            <Text key={`${day}-${index}`} style={[styles.weekday, { color: colors.muted }]}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {Array.from({ length: leadingBlanks }).map((_, index) => (
            <View key={`pad-${index}`} style={styles.cell} />
          ))}
          {days.map((key) => {
            const active = Boolean(activeDates[key]);
            const isToday = key === today;
            return (
              <View key={key} style={styles.cell}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: active ? colors.accent : 'transparent',
                      borderColor: isToday ? colors.accent : colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.dotLabel,
                      { color: active ? colors.accentText : colors.muted },
                    ]}>
                    {dayNumber(key)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
        <Text style={[styles.legend, { color: colors.muted }]}>
          Filled = a task completed or a dhikr goal hit that day.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    marginTop: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  flame: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  stack: {
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 4,
  },
  heroFlame: {
    fontSize: 40,
  },
  heroCount: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroCaption: {
    fontSize: 16,
    fontWeight: '600',
  },
  longest: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '800',
  },
  calendarCard: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dot: {
    width: '100%',
    maxWidth: 36,
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  legend: {
    fontSize: 12,
    lineHeight: 18,
  },
});
