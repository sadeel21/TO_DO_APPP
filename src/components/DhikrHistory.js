/**
 * React concept: presentational child — weekly totals come in as props
 *
 * A compact bar chart for the last 7 local-calendar days (including today).
 */
import { StyleSheet, Text, View } from 'react-native';

import { lastSevenKeys, weekdayLabel } from '@/constants/dhikr';
import { useTheme } from '@/context/ThemeContext';

export default function DhikrHistory({ dhikrId, todayCount, history }) {
  const { colors } = useTheme();
  const keys = lastSevenKeys();
  const values = keys.map((key, index) =>
    index === keys.length - 1 ? todayCount : history[key]?.[dhikrId] || 0
  );
  const max = Math.max(1, ...values);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.caption, { color: colors.muted }]}>Last 7 days</Text>
      <View style={styles.row}>
        {keys.map((key, index) => {
          const value = values[index];
          const height = 8 + (value / max) * 36;
          return (
            <View key={key} style={styles.col}>
              <Text style={[styles.value, { color: colors.muted }]}>{value}</Text>
              <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
                <View
                  style={[
                    styles.bar,
                    { height, backgroundColor: colors.accent, alignSelf: 'flex-end' },
                  ]}
                />
              </View>
              <Text style={[styles.day, { color: colors.muted }]}>{weekdayLabel(key)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginTop: 4,
  },
  caption: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-end',
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 10,
    fontWeight: '700',
  },
  track: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '70%',
    borderRadius: 6,
    alignSelf: 'center',
  },
  day: {
    fontSize: 10,
    fontWeight: '600',
  },
});
