/**
 * React concept: presentational avatar — URI vs derived initials
 *
 * Photo URI comes from Context. Placeholder uses a theme gradient + initials.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/context/ThemeContext';

export default function ProfileAvatar({ name = '', uri, size = 72, onPress }) {
  const { colors } = useTheme();
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initial =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0]?.[0] || '?').toUpperCase();
  const Wrap = onPress ? Pressable : View;
  const inner = size - 6;

  return (
    <Wrap
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? 'Change profile photo' : 'Profile photo'}
      onPress={onPress}
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors.accent,
          shadowColor: colors.accent,
        },
      ]}>
      <View style={[styles.inner, { width: inner, height: inner, borderRadius: inner / 2 }]}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={[colors.accent, colors.accentSoft]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.image}>
            <Text style={[styles.initial, { color: colors.accentText, fontSize: size * 0.32 }]}>
              {initial}
            </Text>
          </LinearGradient>
        )}
      </View>
    </Wrap>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  inner: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
