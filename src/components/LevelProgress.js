/**
 * React concept: derived progress UI (level comes from XP helper, not local state)
 */
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

export default function LevelProgress({ level, xpIntoLevel, xpToNext, percent, compact = false }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={styles.row}>
        <Text style={[styles.level, { color: colors.text }]}>Level {level}</Text>
        <Text style={[styles.xp, { color: colors.muted }]}>
          {xpIntoLevel} / {xpToNext} XP
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.accent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 8,
  },
  compact: {
    maxWidth: 280,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  level: {
    fontSize: 15,
    fontWeight: '800',
  },
  xp: {
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
