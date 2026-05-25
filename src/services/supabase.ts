import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// SecureStore is native-only. On web use localStorage, but guard against SSR
// where window/localStorage don't exist (Node.js pre-render environment).
const isBrowser = Platform.OS === 'web' && typeof localStorage !== 'undefined';

const storage = !isBrowser
  ? Platform.OS !== 'web'
    ? {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      }
    : {
        // SSR context — no-op, sessions are never persisted server-side
        getItem: (_key: string) => Promise.resolve(null),
        setItem: (_key: string, _value: string) => Promise.resolve(),
        removeItem: (_key: string) => Promise.resolve(),
      }
  : {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) =>
        Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    };

const supabaseUrl = (Constants.expoConfig?.extra?.supabaseUrl as string) ?? '';
const supabaseAnonKey = (Constants.expoConfig?.extra?.supabaseAnonKey as string) ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
