/**
 * React concept: presentational component (props in, no persistence here)
 *
 * compact = header chip. Full mode = stats + 30-day calendar.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import { useTheme } from '@/context/ThemeContext';
import { dayNumber, lastNDayKeys, toDayKey, weekdayIndex } from '@/utils/streakLogic';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
    const Chip = onPress ? Pressable : View;
    return (
      <Chip
        accessibilityRole={onPress ? 'link' : undefined}
        accessibilityLabel={label}
        onPress={onPress}
        style={[
          styles.chip,
          { backgroundColor: colors.accentSoft, borderColor: colors.border },
          style,
        ]}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={[styles.chipLabel, { color: colors.text }]}>{label}</Text>
      </Chip>
    );
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  flame: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
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
