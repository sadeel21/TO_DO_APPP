/**
 * React concept: lifting UI selection state up (the selected list lives in Context)
 *
 * Switching lists does not delete tasks — it only changes which slice we show.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useTheme } from '@/context/ThemeContext';

export default function ListSelector({ lists, selectedListId, onSelect }) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {lists.map((list) => {
          const selected = list.id === selectedListId;
          return (
            <Pressable
              key={list.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(list.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.accent : colors.card,
                  borderColor: selected ? colors.accent : colors.border,
                },
              ]}>
              <Text style={[styles.label, { color: selected ? colors.accentText : colors.text }]}>
                {list.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Manage lists"
        onPress={() => router.push('/lists')}
        style={[styles.manage, { borderColor: colors.border, backgroundColor: colors.accentSoft }]}>
        <Text style={[styles.manageLabel, { color: colors.accent }]}>Manage</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  manage: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  manageLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
});
