/**
 * React concept: file-based routing (expo-router Stack)
 *
 * Files in src/app become screens. Nested providers wrap every route
 * so theme, the user name, tasks, dhikr, and streaks are available without prop drilling.
 */
import '@/global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DhikrProvider } from '@/context/DhikrContext';
import { ProgressProvider } from '@/context/ProgressContext';
import { StreakProvider } from '@/context/StreakContext';
import { TaskProvider } from '@/context/TaskContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import AchievementCelebration from '@/components/AchievementCelebration';
import CompletionConfetti from '@/components/CompletionConfetti';
import MotivationToast from '@/components/MotivationToast';
import StreakCelebration from '@/components/StreakCelebration';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <UserProvider>
          <TaskProvider>
            <DhikrProvider>
              <StreakProvider>
                <ProgressProvider>
                  <View style={{ flex: 1 }}>
                    <Stack screenOptions={{ headerShown: false }} />
                    <StreakCelebration />
                    <AchievementCelebration />
                    <CompletionConfetti />
                    <MotivationToast />
                  </View>
                </ProgressProvider>
              </StreakProvider>
            </DhikrProvider>
          </TaskProvider>
        </UserProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
