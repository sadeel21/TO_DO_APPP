/**
 * React concept: ephemeral UI state (temporary undo after a destructive action)
 */
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

export default function UndoBanner({ task, onUndo }) {
  const { colors } = useTheme();

  if (!task) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Undo delete"
      onPress={onUndo}
      style={[styles.banner, { backgroundColor: colors.text }]}>
      <Text style={[styles.message, { color: colors.background }]}>Task deleted</Text>
      <Text style={[styles.undo, { color: colors.accent }]}>Undo</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
  },
  undo: {
    fontSize: 14,
    fontWeight: '800',
  },
});
