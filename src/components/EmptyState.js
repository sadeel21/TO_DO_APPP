/**
 * React concept: presentational component + composition
 *
 * EmptyState has no tasks of its own. The parent decides WHEN to show it
 * and WHAT message to pass. Optional `children` can add extra UI below.
 */
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/Card';
import { useTheme } from '@/context/ThemeContext';

export default function EmptyState({ title, message, children }) {
  const { colors } = useTheme();

  return (
    <Card style={[styles.card, { backgroundColor: colors.accentSoft }]}>
      <View style={[styles.emojiWrap, { backgroundColor: colors.card }]}>
        <Text style={styles.emoji}>✨</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 8,
  },
  emojiWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
