/**
 * React concept: wrapping a native module (expo-image-picker) behind a helper
 *
 * Must run from a tap so the browser does not block the file picker.
 * Camera / library permissions are requested at call time (SDK 57).
 */
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const PICK_OPTIONS = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

async function fromLibrary() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted && permission.status !== 'granted') {
    Alert.alert('Photos', 'Allow photo library access to set a profile picture.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS);
  if (result.canceled) {
    return null;
  }
  return result.assets?.[0]?.uri ?? null;
}

async function fromCamera() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted && permission.status !== 'granted') {
    Alert.alert('Camera', 'Allow camera access to take a profile picture.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync(PICK_OPTIONS);
  if (result.canceled) {
    return null;
  }
  return result.assets?.[0]?.uri ?? null;
}

export async function pickProfileImage(source) {
  try {
    if (source === 'camera') {
      return await fromCamera();
    }
    return await fromLibrary();
  } catch (error) {
    console.warn('Could not pick image', error);
    return null;
  }
}

export function promptProfileImage(onPicked) {
  if (Platform.OS === 'web') {
    pickProfileImage('library').then((uri) => {
      if (uri) {
        onPicked(uri);
      }
    });
    return;
  }

  Alert.alert('Profile photo', 'Choose a photo for your avatar.', [
    { text: 'Camera', onPress: () => pickProfileImage('camera').then((uri) => uri && onPicked(uri)) },
    { text: 'Gallery', onPress: () => pickProfileImage('library').then((uri) => uri && onPicked(uri)) },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
