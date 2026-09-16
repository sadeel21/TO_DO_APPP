/**
 * React concepts:
 * - props + callbacks for complete
 * - expo-router navigation (router.push) to open the details screen
 * - ReanimatedSwipeable (RNGH + Reanimated worklets) for complete / delete
 * - Modal + controlled input for editing the title and attached image
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Card from '@/components/Card';
import EditTaskModal from '@/components/EditTaskModal';
import SubtaskItem from '@/components/SubtaskItem';
import TaskImagePreview from '@/components/TaskImagePreview';
import { formatDueDate, getCategory, getPriority } from '@/constants/taskMeta';
import { useTheme } from '@/context/ThemeContext';

const COMPLETE_COLOR = '#16A34A';
const DELETE_COLOR = '#E11D48';
const ACTION_WIDTH = 96;

function haptic(kind) {
  const run =
    kind === 'success'
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  run.catch(() => {});
}

/** Reanimated worklet interpolates the underlay as the row is dragged. */
function SwipeAction({ progress, label, backgroundColor }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.45, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(progress.value, [0, 1], [0.92, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.actionWrap, { backgroundColor }, style]}>
      <Text style={styles.actionLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function TaskItem({
  task,
  onToggle,
  onDelete,
  onSaveTitle,
  onUpdate,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) {
  const { colors } = useTheme();
  const swipeRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);
  const priority = getPriority(task.priority);
  const category = getCategory(task.category);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 280 });
    translateY.value = withTiming(0, { duration: 280 });
  }, [opacity, translateY]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const subtasks = task.subtasks || [];
  const subDone = subtasks.filter((item) => item.completed).length;

  function openDetails() {
    router.push(`/task/${task.id}`);
  }

  function closeSwipe() {
    swipeRef.current?.close();
  }

  function askDelete() {
    onDelete(task.id, {
      onCancel: closeSwipe,
    });
  }

  function completeFromSwipe() {
    closeSwipe();
    if (task.completed) {
      return;
    }
    haptic('success');
    const completedAt = new Date().toISOString();
    if (onUpdate) {
      onUpdate(task.id, { completed: true, completedAt });
    } else {
      onToggle(task.id);
    }
  }

  // ReanimatedSwipeable reports the drag direction (row translation),
  // not which side of the row opened: RIGHT = swipe right, LEFT = swipe left.
  function onSwipeOpen(direction) {
    if (direction === 'right') {
      completeFromSwipe();
      return;
    }
    if (direction === 'left') {
      haptic('warning');
      askDelete();
    }
  }

  return (
    <Animated.View style={fadeStyle}>
      <Swipeable
        ref={swipeRef}
        friction={2}
        leftThreshold={48}
        rightThreshold={48}
        overshootLeft={false}
        overshootRight={false}
        renderLeftActions={(progress) => (
          <SwipeAction progress={progress} label="Complete" backgroundColor={COMPLETE_COLOR} />
        )}
        renderRightActions={(progress) => (
          <SwipeAction progress={progress} label="Delete" backgroundColor={DELETE_COLOR} />
        )}
        onSwipeableOpen={onSwipeOpen}>
        <Card style={styles.card}>
          <View style={styles.topRow}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.completed }}
            accessibilityLabel={`Mark ${task.text} complete`}
            onPress={() => onToggle(task.id)}
            style={styles.checkboxHit}>
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: task.completed ? colors.checkboxOn : colors.checkbox,
                  backgroundColor: task.completed ? colors.checkboxOn : 'transparent',
                },
              ]}>
              {task.completed ? (
                <Text style={[styles.checkMark, { color: colors.accentText }]}>✓</Text>
              ) : null}
            </View>
          </Pressable>

          {task.imageUri ? (
            <Pressable
              accessibilityRole="imagebutton"
              accessibilityLabel="Preview attached image"
              onPress={() => setPreviewOpen(true)}>
              <Image source={{ uri: task.imageUri }} style={styles.thumb} contentFit="cover" />
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open details for ${task.text}`}
            onPress={openDetails}
            onLongPress={() => router.push(`/focus/${task.id}`)}
            delayLongPress={350}
            style={styles.main}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.text,
                  textDecorationLine: task.completed ? 'line-through' : 'none',
                  opacity: task.completed ? 0.5 : 1,
                },
              ]}>
              {task.text}
            </Text>
            <View style={styles.meta}>
              <View style={[styles.tag, { backgroundColor: `${priority.color}22` }]}>
                <View style={[styles.dot, { backgroundColor: priority.color }]} />
                <Text style={[styles.tagLabel, { color: priority.color }]}>{priority.label}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: `${category.color}22` }]}>
                <Text style={styles.tagLabel}>
                  {category.icon} {category.label}
                </Text>
              </View>
              {task.dueDate ? (
                <Text style={[styles.due, { color: colors.muted }]}>{formatDueDate(task.dueDate)}</Text>
              ) : null}
              {subtasks.length > 0 ? (
                <Text style={[styles.due, { color: colors.accent }]}>
                  {subDone}/{subtasks.length} subtasks
                </Text>
              ) : null}
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Focus on ${task.text}`}
            onPress={() => router.push(`/focus/${task.id}`)}
            style={[styles.editBtn, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.editLabel, { color: colors.accent }]}>Focus</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Hide subtasks' : 'Show subtasks'}
            onPress={() => setExpanded((open) => !open)}
            style={[styles.editBtn, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.editLabel, { color: colors.accent }]}>{expanded ? 'Hide' : 'Sub'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${task.text}`}
            onPress={() => setEditing(true)}
            style={[styles.editBtn, { backgroundColor: colors.accentSoft }]}>
            <Text style={[styles.editLabel, { color: colors.accent }]}>Edit</Text>
          </Pressable>
          </View>

          {expanded ? (
            <View style={[styles.subtasks, { borderTopColor: colors.border }]}>
              {subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onToggle={() => onToggleSubtask(task.id, subtask.id)}
                  onDelete={() => onDeleteSubtask(task.id, subtask.id)}
                />
              ))}
              <View style={styles.subAdd}>
                <TextInput
                  value={subtaskDraft}
                  onChangeText={setSubtaskDraft}
                  placeholder="Add a subtask"
                  placeholderTextColor={colors.muted}
                  onSubmitEditing={() => {
                    onAddSubtask(task.id, subtaskDraft);
                    setSubtaskDraft('');
                  }}
                  style={[
                    styles.subInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add subtask"
                  onPress={() => {
                    onAddSubtask(task.id, subtaskDraft);
                    setSubtaskDraft('');
                  }}>
                  <Text style={[styles.editLabel, { color: colors.accent }]}>Add</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </Card>
      </Swipeable>

      <EditTaskModal
        visible={editing}
        initialText={task.text}
        initialImageUri={task.imageUri || ''}
        allowImage
        onClose={() => setEditing(false)}
        onSave={(text, imageUri) => {
          onSaveTitle(task.id, text);
          if (onUpdate && imageUri !== (task.imageUri || '')) {
            onUpdate(task.id, { imageUri });
          }
          setEditing(false);
        }}
      />
      <TaskImagePreview uri={task.imageUri} visible={previewOpen} onClose={() => setPreviewOpen(false)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxHit: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 13,
    fontWeight: '800',
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  main: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  tagLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  due: {
    fontSize: 11,
    fontWeight: '600',
  },
  editBtn: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtasks: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 2,
  },
  subAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  subInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  actionWrap: {
    flex: 1,
    width: ACTION_WIDTH,
    marginHorizontal: 4,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
