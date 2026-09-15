/**
 * React concepts: local UI state + callbacks into Context
 *
 * The count itself lives in DhikrContext. This card only animates the tap
 * and lets the user edit the daily goal (controlled TextInput in a modal).
 */
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import Card from '@/components/Card';
import DhikrHistory from '@/components/DhikrHistory';
import { useTheme } from '@/context/ThemeContext';

export default function DhikrCounter({ item, count, goal, history, onIncrement, onReset, onSetGoal }) {
  const { colors } = useTheme();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(goal));
  const scale = useSharedValue(1);
  const percent = Math.min(100, Math.round((count / Math.max(goal, 1)) * 100));

  const bounce = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function tap() {
    scale.value = withSequence(withSpring(0.92, { damping: 12, stiffness: 400 }), withSpring(1));
    onIncrement();
  }

  function saveGoal() {
    onSetGoal(goalDraft);
    setEditingGoal(false);
  }

  return (
    <Card style={styles.card}>
      <Text style={[styles.arabic, { color: colors.text }]}>{item.arabic}</Text>
      <Text style={[styles.translit, { color: colors.muted }]}>{item.translit}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increment ${item.translit}`}
        onPress={tap}
        style={styles.tapWrap}>
        <Animated.View style={[styles.tap, { backgroundColor: colors.accent }, bounce]}>
          <Text style={[styles.count, { color: colors.accentText }]}>{count}</Text>
          <Text style={[styles.tapHint, { color: colors.accentText }]}>Tap</Text>
        </Animated.View>
      </Pressable>

      <View style={styles.goalRow}>
        <Text style={[styles.goalLabel, { color: colors.muted }]}>
          Today · goal {goal}
        </Text>
        <Text style={[styles.percent, { color: colors.accent }]}>{percent}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.accent }]} />
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setGoalDraft(String(goal));
            setEditingGoal(true);
          }}>
          <Text style={[styles.link, { color: colors.accent }]}>Edit goal</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Reset ${item.translit}`} onPress={onReset}>
          <Text style={[styles.link, { color: colors.danger }]}>Reset</Text>
        </Pressable>
      </View>

      <DhikrHistory dhikrId={item.id} todayCount={count} history={history} />

      <Modal visible={editingGoal} transparent animationType="fade" onRequestClose={() => setEditingGoal(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Daily goal</Text>
            <View style={styles.presets}>
              {[33, 100, 33 * 3].map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setGoalDraft(String(value))}
                  style={[
                    styles.preset,
                    {
                      borderColor: colors.border,
                      backgroundColor: String(value) === goalDraft ? colors.accentSoft : colors.background,
                    },
                  ]}>
                  <Text style={[styles.presetLabel, { color: colors.text }]}>{value}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={goalDraft}
              onChangeText={setGoalDraft}
              keyboardType="number-pad"
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
              ]}
            />
            <View style={styles.sheetActions}>
              <Pressable onPress={() => setEditingGoal(false)}>
                <Text style={[styles.link, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveGoal} style={[styles.save, { backgroundColor: colors.accent }]}>
                <Text style={[styles.saveLabel, { color: colors.accentText }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    gap: 10,
    alignItems: 'center',
  },
  arabic: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  translit: {
    fontSize: 14,
    fontWeight: '600',
  },
  tapWrap: {
    marginVertical: 8,
  },
  tap: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 44,
    fontWeight: '800',
  },
  tapHint: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.85,
  },
  goalRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  percent: {
    fontSize: 13,
    fontWeight: '800',
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
  },
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
    gap: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
  },
  preset: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  presetLabel: {
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
  },
  save: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveLabel: {
    fontWeight: '800',
  },
});
