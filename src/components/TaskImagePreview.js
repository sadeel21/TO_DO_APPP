/**
 * React concept: Modal overlay for a focused image preview.
 */
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/context/ThemeContext';

export default function TaskImagePreview({ uri, visible, onClose }) {
  const { colors } = useTheme();

  return (
    <Modal visible={Boolean(visible && uri)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Image source={{ uri }} style={styles.image} contentFit="contain" />
        <Pressable onPress={onClose} style={[styles.close, { backgroundColor: colors.card }]}>
          <Text style={[styles.closeLabel, { color: colors.text }]}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 16, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  image: {
    width: '100%',
    height: '70%',
  },
  close: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeLabel: {
    fontWeight: '800',
    fontSize: 15,
  },
});
