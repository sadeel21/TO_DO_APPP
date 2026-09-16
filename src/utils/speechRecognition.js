/**
 * Speech recognition adapter.
 *
 * Web: browser SpeechRecognition (works in Chrome, including Expo web).
 * Native: expo-speech-recognition — NOT bundled in Expo Go; needs a dev build.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export function describeSpeechSupport() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Rec) {
      return { ok: true, backend: 'web' };
    }
    return {
      ok: false,
      message: 'This browser has no speech recognition. Try Chrome.',
    };
  }

  if (Constants.appOwnership === 'expo') {
    return {
      ok: false,
      message:
        'Voice input is not available in Expo Go. It needs a development build with expo-speech-recognition (npx expo run:android / run:ios). On web, use Chrome.',
    };
  }

  return { ok: true, backend: 'native' };
}

function preferredLang() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
  } catch {
    return 'en-US';
  }
}

export function startWebListening({ onPartial, onFinal, onError, onEnd }) {
  const Rec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!Rec) {
    onError?.('This browser has no speech recognition. Try Chrome.');
    return () => {};
  }

  const rec = new Rec();
  rec.lang = preferredLang().startsWith('ar') ? 'ar-SA' : preferredLang();
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.continuous = false;

  rec.onresult = (event) => {
    let interim = '';
    let finalText = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const piece = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) {
        finalText += piece;
      } else {
        interim += piece;
      }
    }
    if (interim) {
      onPartial?.(interim);
    }
    if (finalText.trim()) {
      onFinal?.(finalText.trim());
    }
  };

  rec.onerror = (event) => {
    const code = event?.error;
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      onError?.('Microphone permission was denied.');
    } else if (code === 'no-speech') {
      onError?.('No speech detected. Try again.');
    } else {
      onError?.(code ? `Recognition failed (${code}).` : 'Recognition failed.');
    }
  };

  rec.onend = () => onEnd?.();

  try {
    rec.start();
  } catch (error) {
    onError?.(error.message || 'Could not start the microphone.');
  }

  return () => {
    try {
      rec.stop();
    } catch {
      // Already stopped.
    }
  };
}

export async function startNativeListening({ onPartial, onFinal, onError, onEnd }) {
  let speech;
  try {
    speech = require('expo-speech-recognition');
  } catch {
    onError?.(
      'expo-speech-recognition is not installed. Use a development build, or Chrome on web.'
    );
    return () => {};
  }

  const { ExpoSpeechRecognitionModule } = speech;
  const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!permission.granted) {
    onError?.('Microphone permission was denied.');
    return () => {};
  }

  const subResult = ExpoSpeechRecognitionModule.addListener('result', (event) => {
    const first = event?.results?.[0];
    const transcript = first?.transcript || '';
    if (!transcript.trim()) {
      return;
    }
    if (event.isFinal) {
      onFinal?.(transcript.trim());
    } else {
      onPartial?.(transcript);
    }
  });
  const subError = ExpoSpeechRecognitionModule.addListener('error', (event) => {
    const code = event?.error || event?.message;
    if (String(code).includes('not-allowed') || String(code).includes('permission')) {
      onError?.('Microphone permission was denied.');
    } else {
      onError?.(event?.message || 'Recognition failed.');
    }
  });
  const subEnd = ExpoSpeechRecognitionModule.addListener('end', () => onEnd?.());

  ExpoSpeechRecognitionModule.start({
    lang: preferredLang().startsWith('ar') ? 'ar-SA' : preferredLang(),
    interimResults: true,
    addsPunctuation: true,
  });

  return () => {
    subResult?.remove?.();
    subError?.remove?.();
    subEnd?.remove?.();
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Already stopped.
    }
  };
}
