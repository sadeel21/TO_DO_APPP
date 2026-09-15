/**
 * React concept: nested state — a subtask is data inside its parent task
 *
 * This row does not own the array. It displays one subtask and reports
 * toggle/delete to TaskContext via callbacks.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

export default function SubtaskItem({ subtask, onToggle, onDelete }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: subtask.completed }}
        accessibilityLabel={subtask.text}
        onPress={onToggle}
        style={styles.main}>
        <View
          style={[
            styles.box,
            {
              borderColor: subtask.completed ? colors.checkboxOn : colors.checkbox,
              backgroundColor: subtask.completed ? colors.checkboxOn : 'transparent',
            },
          ]}>
          {subtask.completed ? (
            <Text style={[styles.mark, { color: colors.accentText }]}>✓</Text>
          ) : null}
        </View>
        <Text
          style={[
            styles.label,
            {
              color: colors.text,
              textDecorationLine: subtask.completed ? 'line-through' : 'none',
              opacity: subtask.completed ? 0.5 : 1,
            },
          ]}>
          {subtask.text}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${subtask.text}`} onPress={onDelete}>
        <Text style={[styles.remove, { color: colors.danger }]}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    fontSize: 10,
    fontWeight: '800',
  },
  label: {
    flex: 1,
    fontSize: 14,
  },
  remove: {
    fontSize: 22,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
});
