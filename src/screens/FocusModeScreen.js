/**
 * React concept: interval timer + derived UI (remaining ms → mm:ss + progress)
 *
 * Minimal Pomodoro: one task, 25:00 work / 5:00 break, no list chrome.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { useTasks } from '@/context/TaskContext';
import { useTheme } from '@/context/ThemeContext';

const WORK_MS = 25 * 60 * 1000;
const BREAK_MS = 5 * 60 * 1000;

function formatMs(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function focusPalette(isDark) {
  if (isDark) {
    return {
      bg: '#16141C',
      text: '#E8E4DC',
      muted: '#9A958C',
      line: '#2A2730',
      fill: '#8B9A86',
      button: '#2A2730',
    };
  }
  return {
    bg: '#F3EFE6',
    text: '#2A261F',
    muted: '#6F6A62',
    line: '#DDD6C8',
    fill: '#5F6F5C',
    button: '#E7E1D4',
  };
}

export default function FocusModeScreen() {
  const { id } = useLocalSearchParams();
  const taskId = Array.isArray(id) ? id[0] : id;
  const { tasks, toggleTask } = useTasks();
  const { isDark } = useTheme();
  const task = tasks.find((item) => item.id === taskId);
  const palette = focusPalette(isDark);

  const [mode, setMode] = useState('work');
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(WORK_MS);
  const [complete, setComplete] = useState(false);
  const endAt = useRef(null);
  const duration = mode === 'break' ? BREAK_MS : WORK_MS;

  useEffect(() => {
    if (!running) {
      return;
    }
    const tick = () => {
      const left = Math.max(0, (endAt.current || 0) - Date.now());
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        setComplete(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [running]);

  function start() {
    endAt.current = Date.now() + remaining;
    setComplete(false);
    setRunning(true);
  }

  function pause() {
    setRemaining(Math.max(0, (endAt.current || Date.now()) - Date.now()));
    setRunning(false);
  }

  function reset(nextMode = mode) {
    setRunning(false);
    setComplete(false);
    setMode(nextMode);
    setRemaining(nextMode === 'break' ? BREAK_MS : WORK_MS);
    endAt.current = null;
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
        <Text style={[styles.missing, { color: palette.muted }]}>This task is gone.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.close, { color: palette.text }]}>Close</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const progress = 1 - remaining / duration;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Exit focus mode"
        onPress={() => router.back()}
        style={styles.closeHit}>
        <Text style={[styles.close, { color: palette.muted }]}>Close</Text>
      </Pressable>

      <View style={styles.body}>
        <Text style={[styles.kicker, { color: palette.muted }]}>
          {mode === 'break' ? 'Break' : 'Focus'}
        </Text>
        <Text style={[styles.title, { color: palette.text }]}>{task.text}</Text>
        <Text style={[styles.clock, { color: palette.text }]}>{formatMs(remaining)}</Text>
        <View style={[styles.track, { backgroundColor: palette.line }]}>
          <View
            style={[
              styles.fill,
              { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: palette.fill },
            ]}
          />
        </View>

        {complete ? (
          <View style={styles.done}>
            <Text style={[styles.doneTitle, { color: palette.text }]}>Session complete!</Text>
            <Pressable
              onPress={() => {
                if (!task.completed) {
                  toggleTask(task.id);
                }
                router.back();
              }}
              style={[styles.action, { backgroundColor: palette.fill }]}>
              <Text style={styles.actionLight}>Mark task as complete</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode('break');
                setComplete(false);
                setRemaining(BREAK_MS);
                endAt.current = Date.now() + BREAK_MS;
                setRunning(true);
              }}
              style={[styles.action, { backgroundColor: palette.button }]}>
              <Text style={[styles.actionDark, { color: palette.text }]}>Take a 5 min break</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.controls}>
            <Pressable
              onPress={running ? pause : start}
              style={[styles.action, { backgroundColor: palette.fill }]}>
              <Text style={styles.actionLight}>{running ? 'Pause' : 'Start'}</Text>
            </Pressable>
            <Pressable onPress={() => reset(mode)} style={[styles.action, { backgroundColor: palette.button }]}>
              <Text style={[styles.actionDark, { color: palette.text }]}>Reset</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  closeHit: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  close: {
    fontSize: 15,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 18,
  },
  kicker: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 36,
  },
  clock: {
    fontSize: 64,
    fontWeight: '300',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  controls: {
    gap: 10,
    marginTop: 12,
  },
  done: {
    gap: 10,
    marginTop: 12,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  action: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionLight: {
    color: '#F7F4EE',
    fontWeight: '800',
    fontSize: 16,
  },
  actionDark: {
    fontWeight: '800',
    fontSize: 16,
  },
  missing: {
    padding: 24,
    fontSize: 16,
  },
});
