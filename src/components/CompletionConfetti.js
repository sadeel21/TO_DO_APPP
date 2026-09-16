/**
 * Lightweight confetti burst (React Native Animated — no extra library).
 *
 * Fires when remaining "today" tasks drop to zero. Stays quiet on re-renders
 * while still complete; resets if a task is uncompleted or a new one is added.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

import { useTasks } from '@/context/TaskContext';
import { todaysTaskStats } from '@/utils/greeting';
import { toDayKey } from '@/utils/streakLogic';

const PIECE_COUNT = 28;
const DURATION_MS = 2000;
const COLORS = ['#6D28D9', '#2563EB', '#0D9488', '#EA580C', '#DB2777', '#FBBF24'];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function Particle({ burstId, index }) {
  const { width, height } = Dimensions.get('window');
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const startX = useMemo(() => randomBetween(16, width - 16), [width, burstId]);
  const drift = useMemo(() => randomBetween(-80, 80), [burstId]);
  const spin = useMemo(() => randomBetween(-3, 3), [burstId]);
  const color = COLORS[index % COLORS.length];
  const size = useMemo(() => randomBetween(6, 11), [burstId]);

  useEffect(() => {
    translateY.setValue(-20);
    translateX.setValue(0);
    rotate.setValue(0);
    opacity.setValue(1);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height * 0.85,
        duration: DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: drift,
        duration: DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: spin,
        duration: DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: DURATION_MS,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [burstId, drift, height, opacity, rotate, spin, translateX, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          left: startX,
          width: size,
          height: size * 1.4,
          backgroundColor: color,
          opacity,
          transform: [
            { translateY },
            { translateX },
            {
              rotate: rotate.interpolate({
                inputRange: [-4, 4],
                outputRange: ['-240deg', '240deg'],
              }),
            },
          ],
        },
      ]}
    />
  );
}

export default function CompletionConfetti() {
  const { tasks, hydrated } = useTasks();
  const [burstId, setBurstId] = useState(0);
  const [visible, setVisible] = useState(false);
  const celebratedComplete = useRef(false);
  const prevRemaining = useRef(null);
  const hideTimer = useRef(null);

  const { total, remaining } = todaysTaskStats(tasks, toDayKey());

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const allDone = total > 0 && remaining === 0;

    if (prevRemaining.current === null) {
      prevRemaining.current = remaining;
      // Already complete when the list loaded — don't celebrate a past finish.
      if (allDone) {
        celebratedComplete.current = true;
      }
      return;
    }

    const crossedToComplete = prevRemaining.current > 0 && allDone;
    prevRemaining.current = remaining;

    if (!allDone) {
      celebratedComplete.current = false;
      return;
    }

    if (!crossedToComplete || celebratedComplete.current) {
      return;
    }

    celebratedComplete.current = true;
    setBurstId((current) => current + 1);
    setVisible(true);
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => setVisible(false), DURATION_MS);
  }, [hydrated, total, remaining]);

  useEffect(
    () => () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    },
    []
  );

  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {Array.from({ length: PIECE_COUNT }, (_, index) => (
        <Particle key={`${burstId}-${index}`} burstId={burstId} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
  },
  piece: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
});
