/**
 * React concept: derived UI from props (no local business state)
 *
 * ProgressBar only displays numbers the parent already owns.
 * completed / total are computed in App, then passed down.
 */
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/context/ThemeContext';

export default function ProgressBar({ completed, total }) {
  const { colors } = useTheme();
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(percent / 100, { duration: 350 });
  }, [percent, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>
          {completed} of {total} tasks completed
        </Text>
        <Text style={[styles.percent, { color: colors.accent }]}>{percent}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
        <Animated.View style={[styles.fill, { backgroundColor: colors.accent }, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  percent: {
    fontSize: 14,
    fontWeight: '700',
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
});
