/**
 * React concept: derived progress UI (level comes from XP helper, not local state)
 *
 * Optional Reanimated fill-from-zero on mount (Home). Other screens stay static.
 */
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/context/ThemeContext';
import { colorAlpha } from '@/utils/colorAlpha';

export default function LevelProgress({
  level,
  xpIntoLevel,
  xpToNext,
  percent,
  compact = false,
  animateFill = false,
  replayKey = 0,
}) {
  const { colors } = useTheme();
  const safePercent = Number.isFinite(Number(percent)) ? Number(percent) : 0;
  const width = useSharedValue(animateFill ? 0 : safePercent);
  const glow = useSharedValue(animateFill ? 0 : 1);

  useEffect(() => {
    if (animateFill) {
      width.value = 0;
      glow.value = 0;
      width.value = withTiming(safePercent, { duration: 800, easing: Easing.out(Easing.cubic) });
      glow.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    } else {
      width.value = safePercent;
      glow.value = 1;
    }
  }, [safePercent, animateFill, replayKey, width, glow]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, width.value))}%`,
  }));

  const glowStyle = useAnimatedStyle(() => {
    const pct = Math.min(100, Math.max(0, width.value));
    return {
      left: `${pct}%`,
      opacity: pct < 3 ? 0 : glow.value * 0.9,
      transform: [{ translateX: -7 }],
    };
  });

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={styles.row}>
        <Text style={[styles.level, { color: colors.text }]}>Level {level}</Text>
        <Text style={[styles.xp, { color: colors.muted }]}>
          {xpIntoLevel} / {xpToNext} XP
        </Text>
      </View>
      <View style={styles.barWrap}>
        <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
          <Animated.View style={[styles.fill, fillStyle]}>
            <LinearGradient
              colors={[colors.accent, colors.accentSoft, colors.accent]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.edgeGlow,
            glowStyle,
            { backgroundColor: colorAlpha(colors.accent, 0.55), shadowColor: colors.accent },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 12,
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
  barWrap: {
    justifyContent: 'center',
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  edgeGlow: {
    position: 'absolute',
    top: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
});
