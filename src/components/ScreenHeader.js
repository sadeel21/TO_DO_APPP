/**
 * React concept: expo-router navigation helpers (router.back / router.push)
 *
 * Screens don't implement their own history — the router stack does.
 */
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

export default function ScreenHeader({ title, right }) {
  const { colors } = useTheme();

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={goBack}
        style={[styles.back, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.backLabel, { color: colors.text }]}>Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  back: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  backSpacer: {
    width: 58,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
  },
  right: {
    minWidth: 58,
    alignItems: 'flex-end',
  },
});
