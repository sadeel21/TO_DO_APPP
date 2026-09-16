/**
 * React concept: composition — attach / replace / remove a local image URI.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/context/ThemeContext';
import { promptTaskImage } from '@/utils/pickTaskImage';

export default function TaskImageAttach({ uri, onChange, onPreview }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {uri ? (
        <Pressable accessibilityRole="imagebutton" accessibilityLabel="Preview attached image" onPress={onPreview}>
          <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
        </Pressable>
      ) : null}
      <Pressable
        onPress={() => promptTaskImage(onChange)}
        style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.accentSoft }]}>
        <Text style={[styles.label, { color: colors.accent }]}>{uri ? 'Replace photo' : 'Attach photo'}</Text>
      </Pressable>
      {uri ? (
        <Pressable onPress={() => onChange('')} style={styles.btn}>
          <Text style={[styles.label, { color: colors.danger }]}>Remove</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  btn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});
