/**
 * React concept: wrapping expo-image-picker for task photos (receipts / reminders).
 * Stores a local URI only — same approach as the profile picture.
 */
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const TASK_PICK_OPTIONS = {
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 0.8,
};

async function fromLibrary() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted && permission.status !== 'granted') {
    Alert.alert('Photos', 'Allow photo library access to attach an image.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync(TASK_PICK_OPTIONS);
  if (result.canceled) {
    return null;
  }
  return result.assets?.[0]?.uri ?? null;
}

async function fromCamera() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted && permission.status !== 'granted') {
    Alert.alert('Camera', 'Allow camera access to attach a photo.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync(TASK_PICK_OPTIONS);
  if (result.canceled) {
    return null;
  }
  return result.assets?.[0]?.uri ?? null;
}

export async function pickTaskImage(source) {
  try {
    if (source === 'camera') {
      return await fromCamera();
    }
    return await fromLibrary();
  } catch (error) {
    console.warn('Could not pick task image', error);
    return null;
  }
}

export function promptTaskImage(onPicked) {
  if (Platform.OS === 'web') {
    pickTaskImage('library').then((uri) => {
      if (uri) {
        onPicked(uri);
      }
    });
    return;
  }

  Alert.alert('Attach image', 'Add a photo to this task.', [
    { text: 'Camera', onPress: () => pickTaskImage('camera').then((uri) => uri && onPicked(uri)) },
    { text: 'Gallery', onPress: () => pickTaskImage('library').then((uri) => uri && onPicked(uri)) },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
