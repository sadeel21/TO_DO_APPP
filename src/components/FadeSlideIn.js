/**
 * Reanimated entrance: fade + slight upward slide. Replay when `wave` changes
 * (Home remount / focus), not on unrelated parent re-renders of the same wave.
 */
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export default function FadeSlideIn({ wave = 0, delay = 0, duration = 320, children, style }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = 0;
    translateY.value = 14;
    opacity.value = withDelay(delay, withTiming(1, { duration }));
    translateY.value = withDelay(delay, withTiming(0, { duration }));
    const fallback = setTimeout(() => {
      opacity.value = 1;
      translateY.value = 0;
    }, delay + duration + 80);
    return () => clearTimeout(fallback);
  }, [wave, delay, duration, opacity, translateY]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View pointerEvents="box-none" style={[style, anim]}>
      {children}
    </Animated.View>
  );
}
