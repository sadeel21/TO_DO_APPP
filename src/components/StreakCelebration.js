/**
 * React concept: overlay UI driven by context state
 *
 * Shows when current streak hits a 7-day milestone. Animation is local;
 * whether to show is decided in StreakContext.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { useStreak } from '@/context/StreakContext';
import { useTheme } from '@/context/ThemeContext';

export default function StreakCelebration() {
  const { colors } = useTheme();
  const { celebration, dismissCelebration } = useStreak();

  if (!celebration) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissCelebration} />
      </Animated.View>
      <Animated.View
        entering={ZoomIn.springify().damping(12)}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={[styles.title, { color: colors.text }]}>{celebration} day streak!</Text>
        <Text style={[styles.body, { color: colors.muted }]}>
          A new milestone — keep a task or dhikr goal going tomorrow.
        </Text>
        <Pressable
          onPress={dismissCelebration}
          style={[styles.button, { backgroundColor: colors.accent }]}>
          <Text style={[styles.buttonLabel, { color: colors.accentText }]}>Nice</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 12, 40, 0.45)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  flame: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  button: {
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonLabel: {
    fontWeight: '800',
    fontSize: 16,
  },
});
