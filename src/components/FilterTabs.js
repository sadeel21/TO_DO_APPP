/**
 * React concept: lifting UI state up via props
 *
 * The selected filter lives in App (so TaskList can use it).
 * These tabs only display `value` and call `onChange` — they don't own the list.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

const OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

export default function FilterTabs({ value, onChange }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.accentSoft }]}>
      {OPTIONS.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            style={[
              styles.tab,
              selected && { backgroundColor: colors.card, shadowColor: colors.shadow },
              selected && styles.tabSelected,
            ]}>
            <Text
              style={[
                styles.label,
                { color: selected ? colors.text : colors.muted },
                selected && styles.labelSelected,
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabSelected: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelSelected: {
    fontWeight: '700',
  },
});
