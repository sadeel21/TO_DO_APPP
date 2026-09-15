/**
 * React concept: dynamic routes — src/app/task/[id].tsx → "/task/123"
 *
 * useLocalSearchParams() reads the [id] segment from the URL.
 * Task data comes from TaskContext (same source of truth as the list).
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import Card from '@/components/Card';
import ChipPicker from '@/components/ChipPicker';
import ScreenHeader from '@/components/ScreenHeader';
import { CATEGORIES, PRIORITIES, formatDateTime, formatDueDate, getCategory, getPriority, toDateInput } from '@/constants/taskMeta';
import { useTasks } from '@/context/TaskContext';
import { useTheme } from '@/context/ThemeContext';

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams();
  const taskId = Array.isArray(id) ? id[0] : id;
  const { tasks, updateTask, toggleTask } = useTasks();
  const { colors, isDark } = useTheme();
  const task = tasks.find((item) => item.id === taskId);
  const [notes, setNotes] = useState(task?.notes ?? '');

  useEffect(() => {
    setNotes(task?.notes ?? '');
  }, [task?.id, task?.notes]);

  if (!task) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Task" />
        <Text style={[styles.missing, { color: colors.muted }]}>This task is gone.</Text>
        <Pressable onPress={() => router.replace('/tasks')}>
          <Text style={{ color: colors.accent, fontWeight: '700' }}>Back to list</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const priority = getPriority(task.priority);
  const category = getCategory(task.category);
  const dueOptions = [
    { id: 'none', label: 'No due date', color: colors.muted },
    { id: toDateInput(0), label: 'Today', color: colors.accent },
    { id: toDateInput(1), label: 'Tomorrow', color: colors.accent },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Details" />

        <Card style={styles.hero}>
          <Text style={[styles.taskTitle, { color: colors.text }]}>{task.text}</Text>
          <Text style={[styles.created, { color: colors.muted }]}>
            Created {formatDateTime(task.createdAt)}
          </Text>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.completed }}
            onPress={() => toggleTask(task.id)}
            style={[styles.status, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.statusLabel, { color: colors.accent }]}>
              {task.completed ? 'Completed' : 'Mark complete'}
            </Text>
          </Pressable>
        </Card>

        <Card style={styles.block}>
          <Text style={[styles.blockLabel, { color: colors.muted }]}>PRIORITY</Text>
          <Text style={[styles.blockValue, { color: priority.color }]}>{priority.label}</Text>
          <ChipPicker options={PRIORITIES} value={task.priority} onChange={(value) => updateTask(task.id, { priority: value })} />
        </Card>

        <Card style={styles.block}>
          <Text style={[styles.blockLabel, { color: colors.muted }]}>CATEGORY</Text>
          <Text style={[styles.blockValue, { color: colors.text }]}>
            {category.icon} {category.label}
          </Text>
          <ChipPicker options={CATEGORIES} value={task.category} onChange={(value) => updateTask(task.id, { category: value })} />
        </Card>

        <Card style={styles.block}>
          <Text style={[styles.blockLabel, { color: colors.muted }]}>DUE DATE</Text>
          <Text style={[styles.blockValue, { color: colors.text }]}>{formatDueDate(task.dueDate)}</Text>
          <ChipPicker
            options={dueOptions}
            value={task.dueDate ?? 'none'}
            onChange={(value) => updateTask(task.id, { dueDate: value === 'none' ? null : value })}
          />
        </Card>

        <Card style={styles.block}>
          <Text style={[styles.blockLabel, { color: colors.muted }]}>NOTES</Text>
          <TextInput
            value={notes}
            onChangeText={(value) => {
              setNotes(value);
              updateTask(task.id, { notes: value });
            }}
            placeholder="Add notes..."
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            style={[
              styles.notes,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: 24,
  },
  content: {
    gap: 14,
    paddingBottom: 32,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  missing: {
    marginTop: 24,
    marginBottom: 12,
  },
  hero: {
    gap: 10,
    padding: 18,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  created: {
    fontSize: 14,
  },
  status: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusLabel: {
    fontWeight: '800',
    fontSize: 13,
  },
  block: {
    gap: 10,
    padding: 16,
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  blockValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  notes: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    lineHeight: 22,
  },
});
