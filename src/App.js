/**
 * React concepts: lifting state up, useState, useMemo, composing children
 *
 * Tasks live in TaskContext so other routes (details/settings) can read them.
 * Filter + search are view-only — they do not mutate the source array.
 */
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import FilterTabs from '@/components/FilterTabs';
import ListSelector from '@/components/ListSelector';
import ProgressBar from '@/components/ProgressBar';
import SearchBar from '@/components/SearchBar';
import SortBar from '@/components/SortBar';
import StreakDisplay from '@/components/StreakDisplay';
import TaskInput from '@/components/TaskInput';
import TaskList from '@/components/TaskList';
import UndoBanner from '@/components/UndoBanner';
import { useStreak } from '@/context/StreakContext';
import { useTasks } from '@/context/TaskContext';
import { useTheme } from '@/context/ThemeContext';

const EMPTY_COPY = {
  all: {
    title: 'Your list is clear',
    message: 'Add a task above and it will show up here.',
  },
  active: {
    title: 'Nothing active',
    message: 'All tasks are done — nice work. Switch to All to see them.',
  },
  completed: {
    title: 'No completed tasks',
    message: 'Tap a task’s checkbox to mark it complete.',
  },
  search: {
    title: 'No results',
    message: 'Nothing in this list matches your search.',
  },
};

export default function App() {
  const { colors, isDark } = useTheme();
  const {
    tasks,
    lists,
    selectedListId,
    selectedList,
    selectList,
    addTask,
    toggleTask,
    requestDelete,
    updateTask,
    clearCompleted,
    undoItem,
    undoDelete,
    completedThisWeek,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    loading,
    error,
    reload,
  } = useTasks();
  const { current, longest, activeDates } = useStreak();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');

  const listTasks = useMemo(
    () => tasks.filter((task) => task.listId === selectedListId),
    [tasks, selectedListId]
  );
  const remaining = listTasks.filter((task) => !task.completed).length;
  const completedCount = listTasks.length - remaining;

  const visibleTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = listTasks.filter((task) => {
      if (filter === 'active' && task.completed) {
        return false;
      }
      if (filter === 'completed' && !task.completed) {
        return false;
      }
      if (
        needle &&
        !task.text.toLowerCase().includes(needle) &&
        !(task.subtasks || []).some((sub) => sub.text.toLowerCase().includes(needle))
      ) {
        return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sort === 'alpha') {
        return a.text.localeCompare(b.text);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [listTasks, filter, query, sort]);

  const empty = query.trim() ? EMPTY_COPY.search : EMPTY_COPY[filter];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.glow, { backgroundColor: colors.backgroundGlow }]} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.kicker, { color: colors.accent }]}>TODAY</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              {selectedList?.name || 'To-Do'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {remaining} remaining · {completedThisWeek} completed this week
            </Text>
            <StreakDisplay
              compact
              current={current}
              longest={longest}
              activeDates={activeDates}
              onPress={() => router.push('/streak')}
            />
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open home"
              onPress={() => router.replace('/')}
              style={[
                styles.settingsButton,
                { borderColor: colors.border, backgroundColor: colors.card, shadowColor: colors.shadow },
              ]}>
              <Text style={[styles.settingsLabel, { color: colors.text }]}>Home</Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open dhikr counter"
              onPress={() => router.push('/dhikr')}
              style={[
                styles.settingsButton,
                { borderColor: colors.border, backgroundColor: colors.card, shadowColor: colors.shadow },
              ]}>
              <Text style={[styles.settingsLabel, { color: colors.text }]}>Dhikr</Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open settings"
              onPress={() => router.push('/settings')}
              style={[
                styles.settingsButton,
                { borderColor: colors.border, backgroundColor: colors.card, shadowColor: colors.shadow },
              ]}>
              <Text style={[styles.settingsLabel, { color: colors.text }]}>Settings</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.status} />
        ) : null}
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            <Pressable onPress={reload}>
              <Text style={[styles.errorRetry, { color: colors.accent }]}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <ListSelector lists={lists} selectedListId={selectedListId} onSelect={selectList} />
        <SearchBar value={query} onChangeText={setQuery} />
        <ProgressBar completed={completedCount} total={listTasks.length} />
        <TaskInput onAdd={addTask} />
        <FilterTabs value={filter} onChange={setFilter} />
        <SortBar value={sort} onChange={setSort} />
        <Text style={[styles.hint, { color: colors.muted }]}>
          Swipe right to complete · swipe left to delete · Edit to rename · Focus for a timer · tap the title for details
        </Text>

        <TaskList
          tasks={visibleTasks}
          emptyTitle={empty.title}
          emptyMessage={empty.message}
          onToggle={toggleTask}
          onDelete={requestDelete}
          onSaveTitle={(id, text) => updateTask(id, { text })}
          onUpdate={updateTask}
          onAddSubtask={addSubtask}
          onToggleSubtask={toggleSubtask}
          onDeleteSubtask={deleteSubtask}
        />

        {completedCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear completed tasks"
            onPress={clearCompleted}
            style={[styles.clearButton, { borderColor: colors.border }]}>
            <Text style={[styles.clearLabel, { color: colors.danger }]}>Clear completed</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <UndoBanner task={undoItem} onUndo={undoDelete} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.7,
  },
  content: {
    padding: 24,
    gap: 18,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  headerActions: {
    gap: 8,
    alignItems: 'flex-end',
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
  },
  settingsButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
  },
  status: {
    marginVertical: 8,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  errorRetry: {
    fontSize: 14,
    fontWeight: '800',
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  clearLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});
