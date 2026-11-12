import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'dark' | 'light';
type ThemeListener = (isDark: boolean) => void;

let currentIsDark = false;
let isInitialized = false;
const listeners = new Set<ThemeListener>();

// Initialize from storage on app start
export const initTheme = async (): Promise<boolean> => {
  if (isInitialized) return currentIsDark;
  try {
    const stored = await AsyncStorage.getItem('app_theme');
    currentIsDark = stored === 'dark';
  } catch {
    currentIsDark = false;
  }
  isInitialized = true;
  listeners.forEach((fn) => fn(currentIsDark));
  return currentIsDark;
};

// Start initialization immediately
initTheme();

export const getIsDark = (): boolean => currentIsDark;

export const setAppTheme = async (isDark: boolean): Promise<void> => {
  currentIsDark = isDark;
  isInitialized = true;
  try {
    await AsyncStorage.setItem('app_theme', isDark ? 'dark' : 'light');
  } catch (err) {
    console.warn('Failed to save app_theme:', err);
  }
  listeners.forEach((fn) => {
    try {
      fn(currentIsDark);
    } catch {}
  });
};

export const toggleAppTheme = async (): Promise<boolean> => {
  const next = !currentIsDark;
  await setAppTheme(next);
  return next;
};

export const addThemeListener = (listener: ThemeListener): (() => void) => {
  listeners.add(listener);
  // Call listener with current state immediately
  try {
    listener(currentIsDark);
  } catch {}
  return () => {
    listeners.delete(listener);
  };
};

export const useAppTheme = (initialDark?: boolean) => {
  const [isDark, setIsDark] = useState<boolean>(
    initialDark !== undefined ? initialDark : currentIsDark
  );

  useEffect(() => {
    // Initial fetch from storage to ensure accuracy
    AsyncStorage.getItem('app_theme').then((stored) => {
      if (stored) {
        const dark = stored === 'dark';
        currentIsDark = dark;
        setIsDark(dark);
      }
    });

    const unsubscribe = addThemeListener((dark) => {
      setIsDark(dark);
    });

    return unsubscribe;
  }, []);

  const toggle = useCallback(async () => {
    return await toggleAppTheme();
  }, []);

  const set = useCallback(async (dark: boolean) => {
    await setAppTheme(dark);
  }, []);

  return { isDark, toggleTheme: toggle, setTheme: set };
};
