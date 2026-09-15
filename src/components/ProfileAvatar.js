/**
 * React concept: presentational avatar — URI vs derived initial
 *
 * Photo URI comes from Context/AsyncStorage. The placeholder is the first
 * letter of the name on a themed circle.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/context/ThemeContext';

export default function ProfileAvatar({ name = '', uri, size = 72, onPress }) {
  const { colors } = useTheme();
  const initial = (name.trim()[0] || '?').toUpperCase();
  const Wrap = onPress ? Pressable : View;

  return (
    <Wrap
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? 'Change profile photo' : 'Profile photo'}
      onPress={onPress}
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accentSoft,
          borderColor: colors.accent,
        },
      ]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" />
      ) : (
        <Text style={[styles.initial, { color: colors.accent, fontSize: size * 0.4 }]}>{initial}</Text>
      )}
    </Wrap>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    fontWeight: '800',
  },
});
