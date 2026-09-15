/**
 * React concepts: Context + useEffect to read/write AsyncStorage
 *
 * Name + profile photo URI are app-wide. The old `@todo/user-name` string
 * is migrated into this JSON blob once.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@todo/user';
const LEGACY_NAME_KEY = '@todo/user-name';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const legacyName = raw ? null : await AsyncStorage.getItem(LEGACY_NAME_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw);
          setName(parsed.name || '');
          setPhotoUri(parsed.photoUri || '');
        } else if (!cancelled && legacyName) {
          setName(legacyName);
        }
      } catch (error) {
        console.warn('Could not load profile', error);
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ name, photoUri })).catch((error) => {
      console.warn('Could not save profile', error);
    });
  }, [name, photoUri, hydrated]);

  const value = useMemo(
    () => ({
      name,
      photoUri,
      hydrated,
      async saveName(next) {
        const trimmed = next.trim();
        if (!trimmed) {
          return false;
        }
        setName(trimmed);
        return true;
      },
      savePhoto(uri) {
        setPhotoUri(uri || '');
      },
    }),
    [name, photoUri, hydrated]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used inside UserProvider');
  }
  return context;
}
