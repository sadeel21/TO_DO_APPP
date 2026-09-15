/**
 * React concept: presentational badge from props (unlocked vs locked)
 *
 * Fill colors come from ThemeContext.badge so light/dark stay in one palette.
 */
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

export default function AchievementBadge({ achievement }) {
  const { colors } = useTheme();
  const locked = !achievement.unlocked;
  const tint = colors.badge[achievement.id] || {
    fill: colors.accent,
    soft: colors.accentSoft,
    ink: colors.accent,
    lockedFill: colors.progressTrack,
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tint.soft,
          borderColor: locked ? tint.lockedFill : tint.fill,
        },
      ]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: locked ? tint.lockedFill : tint.fill },
        ]}>
        <Text style={styles.icon}>{achievement.icon}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{achievement.title}</Text>
        <Text style={[styles.description, { color: colors.muted }]}>{achievement.description}</Text>
        <Text style={[styles.progress, { color: tint.ink }]}>
          {locked
            ? `${Math.min(achievement.current, achievement.target)} / ${achievement.target}`
            : 'Unlocked'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 26,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  progress: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
});
