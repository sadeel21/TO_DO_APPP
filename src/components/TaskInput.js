/**
 * React concept: controlled input + lifting state up via props
 *
 * Local draft state (text, priority, category, due date) stays here.
 * onAdd sends a payload to the parent / TaskContext — lifting state up.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import ChipPicker from '@/components/ChipPicker';
import TaskImageAttach from '@/components/TaskImageAttach';
import VoiceTaskInput from '@/components/VoiceTaskInput';
import { CATEGORIES, PRIORITIES, toDateInput } from '@/constants/taskMeta';
import { useTheme } from '@/context/ThemeContext';

export default function TaskInput({ onAdd }) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('personal');
  const [dueDate, setDueDate] = useState('none');
  const [imageUri, setImageUri] = useState('');

  const dueOptions = [
    { id: 'none', label: 'No due date', color: colors.muted },
    { id: toDateInput(0), label: 'Today', color: colors.accent },
    { id: toDateInput(1), label: 'Tomorrow', color: colors.accent },
  ];

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    onAdd({
      text: trimmed,
      priority,
      category,
      dueDate: dueDate === 'none' ? null : dueDate,
      imageUri,
    });
    setText('');
    setPriority('medium');
    setCategory('personal');
    setDueDate('none');
    setImageUri('');
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleAdd}
          placeholder="What needs doing?"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add task"
          onPress={handleAdd}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Text style={[styles.buttonLabel, { color: colors.accentText }]}>Add</Text>
        </Pressable>
        <VoiceTaskInput onConfirm={onAdd} priority={priority} category={category} />
      </View>
      <ChipPicker label="Priority" options={PRIORITIES} value={priority} onChange={setPriority} />
      <ChipPicker label="Category" options={CATEGORIES} value={category} onChange={setCategory} />
      <ChipPicker label="Due" options={dueOptions} value={dueDate} onChange={setDueDate} />
      <TaskImageAttach uri={imageUri} onChange={setImageUri} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    zIndex: 8,
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  button: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
