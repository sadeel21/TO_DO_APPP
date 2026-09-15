/**
 * React concept: reusable presentational picker (props in, onChange out)
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

export default function ChipPicker({ label, options, value, onChange }) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.legend, { color: colors.muted }]}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.id)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? option.color ?? colors.accent : colors.border,
                  backgroundColor: selected ? `${option.color ?? colors.accent}22` : colors.card,
                },
              ]}>
              <Text style={[styles.chipLabel, { color: selected ? option.color ?? colors.accent : colors.text }]}>
                {option.icon ? `${option.icon} ` : ''}
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  legend: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});
