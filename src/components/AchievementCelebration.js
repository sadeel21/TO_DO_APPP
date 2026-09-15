/**
 * React concept: overlay UI driven by context (new achievement unlock)
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { useProgress } from '@/context/ProgressContext';
import { useTheme } from '@/context/ThemeContext';

export default function AchievementCelebration() {
  const { colors } = useTheme();
  const { celebration, dismissCelebration } = useProgress();

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
        <Text style={styles.icon}>{celebration.icon}</Text>
        <Text style={[styles.kicker, { color: colors.accent }]}>Achievement unlocked</Text>
        <Text style={[styles.title, { color: colors.text }]}>{celebration.title}</Text>
        <Text style={[styles.body, { color: colors.muted }]}>{celebration.description}</Text>
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
    zIndex: 60,
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
  icon: {
    fontSize: 48,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
