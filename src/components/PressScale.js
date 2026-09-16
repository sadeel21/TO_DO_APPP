/**
 * Reanimated press feedback — scale to 0.97 without delaying onPress.
 */
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function PressScale({
  children,
  style,
  pressStyle,
  onPressIn,
  onPressOut,
  ...rest
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      {...rest}
      style={pressStyle}
      onPressIn={(event) => {
        scale.value = withTiming(0.97, { duration: 90 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, { duration: 140 });
        onPressOut?.(event);
      }}>
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}
