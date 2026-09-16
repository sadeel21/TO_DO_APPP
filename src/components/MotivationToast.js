/**
 * React concept: derived UI from Context — a short toast after completing a task.
 * Uses Reanimated withTiming (not entering FadeIn) so it stays visible on web.
 */
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTasks } from '@/context/TaskContext';
import { useTheme } from '@/context/ThemeContext';

export default function MotivationToast() {
  const { colors } = useTheme();
  const { motivation, clearMotivation } = useTasks();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    if (!motivation) {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(12, { duration: 180 });
      return;
    }
    opacity.value = withTiming(1, { duration: 220 });
    translateY.value = withTiming(0, { duration: 220 });
    const timer = setTimeout(() => clearMotivation?.(), 2000);
    return () => clearTimeout(timer);
  }, [motivation, clearMotivation, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!motivation) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        style,
        { backgroundColor: colors.card, borderColor: colors.accent, shadowColor: colors.shadow },
      ]}>
      <Text style={[styles.text, { color: colors.text }]}>{motivation}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 96,
    zIndex: 90,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
  text: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
});
