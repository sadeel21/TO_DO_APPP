/**
 * React concept: controlled input for search (filter as you type)
 */
import { StyleSheet, TextInput } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

export default function SearchBar({ value, onChangeText }) {
  const { colors } = useTheme();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="Search this list..."
      placeholderTextColor={colors.muted}
      autoCapitalize="none"
      autoCorrect={false}
      style={[
        styles.input,
        {
          color: colors.text,
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
});
