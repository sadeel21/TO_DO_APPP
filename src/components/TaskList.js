/**
 * React concept: lists + rendering children from props
 *
 * TaskList receives the (already filtered) array from the parent and maps it.
 * `.map` needs a unique `key` so React can track each row.
 * Empty UI is a separate component — TaskList just chooses when to show it.
 */
import { StyleSheet, View } from 'react-native';

import EmptyState from '@/components/EmptyState';
import TaskItem from '@/components/TaskItem';

export default function TaskList({
  tasks,
  emptyTitle,
  emptyMessage,
  onToggle,
  onDelete,
  onSaveTitle,
  onUpdate,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  if (tasks.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <View style={styles.list}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onSaveTitle={onSaveTitle}
          onUpdate={onUpdate}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
});
