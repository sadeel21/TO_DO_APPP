/**
 * React concept: component composition (children)
 *
 * A reusable wrapper. Parents pass inner UI as children:
 *   <Card><Text>Hello</Text></Card>
 * Card does not need to know what is inside.
 */
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

export default function Card({ children, style }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
});
