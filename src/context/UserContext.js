/**
 * React concepts: Context + useEffect to read/write profile
 *
 * Name, photo URI, XP, and level live on the users table.
 * The onboarding-completed flag (with user id) stays in AsyncStorage.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_USER_ID } from '@/utils/config';
import {
  getUserProfile,
  loginUser,
  setApiUserId,
  updateUserProfile,
} from '@/utils/api';

const ONBOARDING_KEY = '@todo/onboarding-completed';
const LEGACY_USER_KEY = '@todo/user';
const LEGACY_NAME_KEY = '@todo/user-name';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function applyProfile(row, fallbackName = '', fallbackPhoto = '') {
    const id = Number(row?.id);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('Server did not return a user id.');
    }
    const nextName = String(row.name || fallbackName || '').trim();
    if (!nextName) {
      throw new Error('Server did not return a user name.');
    }
    setApiUserId(id);
    setUserId(id);
    setName(nextName);
    setPhotoUri(row.profile_image_url || fallbackPhoto || '');
    setXp(Number(row.xp) || 0);
    setLevel(Number(row.level) || 1);
    return id;
  }

  useEffect(() => {
    let cancelled = false;

    async function rememberOnboarding(id) {
      await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ userId: id }));
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const onboardRaw = await AsyncStorage.getItem(ONBOARDING_KEY);
        let storedId = null;
        if (onboardRaw) {
          try {
            const parsed = JSON.parse(onboardRaw);
            storedId = parsed.userId || parsed;
          } catch {
            storedId = Number(onboardRaw) || null;
          }
        }

        if (storedId) {
          const row = await getUserProfile(storedId);
          if (!cancelled) {
            applyProfile(row);
          }
          return;
        }

        const legacyRaw = await AsyncStorage.getItem(LEGACY_USER_KEY);
        const legacyName =
          (legacyRaw ? JSON.parse(legacyRaw).name : null) ||
          (await AsyncStorage.getItem(LEGACY_NAME_KEY));
        if (legacyName && String(legacyName).trim()) {
          const row = await loginUser(String(legacyName).trim());
          await rememberOnboarding(row.id);
          const photo = legacyRaw ? JSON.parse(legacyRaw).photoUri : '';
          if (photo) {
            await updateUserProfile({ profile_image_url: photo }, row.id);
            row.profile_image_url = photo;
          }
          if (!cancelled) {
            applyProfile(row);
          }
          return;
        }

        if (!cancelled) {
          setApiUserId(API_USER_ID);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load profile from the server.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHydrated(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      userId,
      name,
      photoUri,
      xp,
      level,
      hydrated,
      loading,
      error,
      async saveName(next) {
        const trimmed = next.trim();
        if (!trimmed) {
          return false;
        }
        console.log('[onboarding] continue', { hasUserId: Boolean(userId), hasPhoto: Boolean(photoUri) });
        try {
          if (!userId) {
            console.log('[onboarding] before API POST /users/login');
            let row = await loginUser(trimmed);
            console.log('[onboarding] after API POST /users/login', row);
            const id = Number(row.id);
            if (photoUri) {
              console.log('[onboarding] before API PUT /users/:id photo');
              const updated = await updateUserProfile({ profile_image_url: photoUri }, id);
              console.log('[onboarding] after API PUT /users/:id photo', updated);
              if (updated) {
                row = updated;
              }
            }
            console.log('[onboarding] before AsyncStorage onboarding flag');
            await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ userId: id }));
            console.log('[onboarding] after AsyncStorage onboarding flag');
            console.log('[onboarding] before showing home');
            applyProfile(row, trimmed, photoUri);
            console.log('[onboarding] after showing home', { userId: id, name: row.name || trimmed });
          } else {
            console.log('[onboarding] before API PUT /users/:id name');
            const row = await updateUserProfile({ name: trimmed }, userId);
            console.log('[onboarding] after API PUT /users/:id name', row);
            if (!row || row.id == null) {
              throw new Error('Server did not return a user id and name.');
            }
            setName(row.name || trimmed);
          }
          setError(null);
          return true;
        } catch (err) {
          console.error('[onboarding] failed', err);
          setError(err.message || 'Could not save your name. Check that the server is running.');
          return false;
        }
      },
      async savePhoto(uri) {
        const next = uri || '';
        setPhotoUri(next);
        if (!userId) {
          return;
        }
        try {
          await updateUserProfile({ profile_image_url: next }, userId);
          setError(null);
        } catch (err) {
          setError(err.message);
        }
      },
      async saveProgress({ xp: nextXp, level: nextLevel }) {
        if (!userId) {
          return;
        }
        if (nextXp === xp && nextLevel === level) {
          return;
        }
        try {
          await updateUserProfile({ xp: nextXp, level: nextLevel }, userId);
          setXp(nextXp);
          setLevel(nextLevel);
          setError(null);
        } catch (err) {
          setError(err.message);
        }
      },
    }),
    [userId, name, photoUri, xp, level, hydrated, loading, error]
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
