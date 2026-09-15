/**
 * React concept: file-based routing — src/app/dhikr.js → "/dhikr"
 *
 * This screen only composes DhikrCounter cards. Counts, daily reset, and
 * AsyncStorage live in DhikrContext.
 */
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import DhikrCounter from '@/components/DhikrCounter';
import ScreenHeader from '@/components/ScreenHeader';
import { useDhikr } from '@/context/DhikrContext';
import { useTheme } from '@/context/ThemeContext';

export default function DhikrScreen() {
  const { colors, isDark } = useTheme();
  const { items, counts, goals, history, increment, reset, setGoal } = useDhikr();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Dhikr" />
        <Text style={[styles.intro, { color: colors.muted }]}>
          Tap a circle to count. Totals reset at midnight and yesterday is kept in history.
        </Text>
        {items.map((item) => (
          <DhikrCounter
            key={item.id}
            item={item}
            count={counts[item.id] || 0}
            goal={goals[item.id] || item.defaultGoal}
            history={history}
            onIncrement={() => increment(item.id)}
            onReset={() => reset(item.id)}
            onSetGoal={(value) => setGoal(item.id, value)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 40,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
  },
});
