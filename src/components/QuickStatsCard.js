/**
 * One tappable home-screen stat tile (tasks / dhikr / streak).
 *
 * Color comes from ThemeContext so light and dark palettes stay in sync.
 */
import { StyleSheet, Text, View } from 'react-native';

import PressScale from '@/components/PressScale';
import { useTheme } from '@/context/ThemeContext';

export default function QuickStatsCard({ label, value, icon, tint, onPress }) {
  const { colors } = useTheme();
  const palette = colors.stats?.[tint] || colors.stats.tasks;

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      onPress={onPress}
      pressStyle={styles.press}
      style={[
        styles.card,
        {
          backgroundColor: palette.soft,
          borderColor: palette.fill,
          shadowColor: palette.fill,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: palette.fill }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color: palette.ink }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.muted }]} numberOfLines={1}>
        {label}
      </Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  press: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    minWidth: 0,
    minHeight: 116,
    height: '100%',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 15,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
