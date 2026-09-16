/**
 * React concept: controlled input inside a Modal
 *
 * The draft title is local state. Save calls updateTask so Context
 * (and AsyncStorage) stay the source of truth.
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import TaskImageAttach from '@/components/TaskImageAttach';
import { useTheme } from '@/context/ThemeContext';

export default function EditTaskModal({
  visible,
  initialText,
  initialImageUri = '',
  allowImage = false,
  onSave,
  onClose,
  title = 'Edit task',
  placeholder = 'Task title',
}) {
  const { colors } = useTheme();
  const [text, setText] = useState(initialText);
  const [imageUri, setImageUri] = useState(initialImageUri);

  useEffect(() => {
    if (visible) {
      setText(initialText);
      setImageUri(initialImageUri || '');
    }
  }, [visible, initialText, initialImageUri]);

  function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    onSave(trimmed, imageUri);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            autoFocus
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
          {allowImage ? <TaskImageAttach uri={imageUri} onChange={setImageUri} /> : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.action}>
              <Text style={[styles.actionLabel, { color: colors.muted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleSave}
              style={[styles.save, { backgroundColor: colors.accent }]}>
              <Text style={[styles.actionLabel, { color: colors.accentText }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 12, 40, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  action: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  save: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
