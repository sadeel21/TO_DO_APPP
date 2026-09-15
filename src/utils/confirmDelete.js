/**
 * React concept: platform-specific APIs behind a small helper
 *
 * Alert.alert is the native confirm dialog. Web gets window.confirm
 * so the same Cancel/Delete choice works in the browser too.
 */
import { Alert, Platform } from 'react-native';

export function confirmDelete({ title = 'Delete this task?', message, onConfirm, onCancel }) {
  if (Platform.OS === 'web') {
    const ok = typeof window !== 'undefined' && window.confirm(title);
    if (ok) {
      onConfirm?.();
    } else {
      onCancel?.();
    }
    return;
  }

  Alert.alert(title, message || 'You can undo for a few seconds after deleting.', [
    { text: 'Cancel', style: 'cancel', onPress: onCancel },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}
