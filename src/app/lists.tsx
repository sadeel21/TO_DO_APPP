/**
 * React concept: CRUD on a nested collection (lists) stored in Context
 *
 * Creating/renaming/deleting lists updates Context; AsyncStorage persists it.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import Card from '@/components/Card';
import EditTaskModal from '@/components/EditTaskModal';
import ScreenHeader from '@/components/ScreenHeader';
import { useTasks } from '@/context/TaskContext';
import { useTheme } from '@/context/ThemeContext';
import { confirmDelete } from '@/utils/confirmDelete';

export default function ListsScreen() {
  const { colors, isDark } = useTheme();
  const { lists, selectedListId, selectList, createList, renameList, deleteList } = useTasks();
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(null);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Lists" />
        <Text style={[styles.help, { color: colors.muted }]}>
          Each task lives in one list. Deleting a list moves its tasks to another list.
        </Text>

        {lists.map((list) => {
          const selected = list.id === selectedListId;
          return (
            <Card key={list.id} style={styles.row}>
              <Pressable onPress={() => selectList(list.id)} style={styles.nameHit}>
                <Text style={[styles.name, { color: colors.text }]}>{list.name}</Text>
                {selected ? (
                  <Text style={[styles.badge, { color: colors.accent }]}>Selected</Text>
                ) : null}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setRenaming(list)}
                style={styles.action}>
                <Text style={[styles.actionLabel, { color: colors.accent }]}>Rename</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (lists.length <= 1) {
                    return;
                  }
                  confirmDelete({
                    title: 'Delete this list?',
                    message: 'Tasks in it will move to another list.',
                    onConfirm: () => deleteList(list.id),
                  });
                }}
                style={styles.action}>
                <Text style={[styles.actionLabel, { color: colors.danger }]}>Delete</Text>
              </Pressable>
            </Card>
          );
        })}

        <Pressable
          accessibilityRole="button"
          onPress={() => setCreating(true)}
          style={[styles.add, { backgroundColor: colors.accent }]}>
          <Text style={[styles.addLabel, { color: colors.accentText }]}>New list</Text>
        </Pressable>
      </ScrollView>

      <EditTaskModal
        visible={creating}
        initialText=""
        title="New list"
        placeholder="List name"
        onClose={() => setCreating(false)}
        onSave={(name) => {
          createList(name);
          setCreating(false);
        }}
      />
      <EditTaskModal
        visible={Boolean(renaming)}
        initialText={renaming?.name ?? ''}
        title="Rename list"
        placeholder="List name"
        onClose={() => setRenaming(null)}
        onSave={(name) => {
          renameList(renaming.id, name);
          setRenaming(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 12,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  help: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameHit: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  action: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  add: {
    marginTop: 8,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  addLabel: {
    fontWeight: '800',
    fontSize: 16,
  },
});
