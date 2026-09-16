/**
 * React concept: file-based routing — src/app/index.js is the initial route "/"
 *
 * First launch: NameEntry (API login + onboarding flag).
 * Every later open: HomeScreen welcome, then the user taps through to /tasks.
 */
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import HomeScreen from '@/components/HomeScreen';
import NameEntry from '@/components/NameEntry';
import ScreenErrorBoundary from '@/components/ScreenErrorBoundary';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';

export default function Index() {
  const { colors } = useTheme();
  const { name, userId, hydrated } = useUser();

  if (!hydrated) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!name || !userId) {
    return <NameEntry />;
  }

  return (
    <ScreenErrorBoundary colors={colors}>
      <HomeScreen />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
