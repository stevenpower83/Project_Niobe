# Skills Notes — Project Niobe

Reusable patterns discovered during the Flet → React Native + Expo conversion.

## Supabase + Expo Secure Store session persistence

When using `@supabase/supabase-js` in React Native, pass a custom `storage` adapter that
wraps `expo-secure-store`. This keeps JWT tokens in the device keychain rather than
unencrypted AsyncStorage.

```ts
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const storage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(url, key, {
  auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
```

## Expo public constants pattern for Supabase credentials

Store `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `app.config.js` under `expo.extra`, not
hardcoded in source. Prefix env vars with `EXPO_PUBLIC_` so they are safe to expose in
client builds.

```js
// app.config.js
export default {
  expo: {
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
  },
};
```

Read them in code via `Constants.expoConfig?.extra?.supabaseUrl`.

## Auth redirect pattern for Expo Router

Use `useRef` to track whether the initial redirect has fired. React to `onAuthStateChange`
(covers INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED) so you don't need a
separate `getSession()` call. Only force-redirect on sign-out after the initial load to
avoid interrupting in-app navigation.

## Mounted ref for async cleanup

Every screen that does async work on mount should track `mounted.current` via a `useRef`
and skip state updates when `false`. This avoids "setState on unmounted component" warnings.

```ts
const mounted = useRef(true);
useEffect(() => {
  mounted.current = true;
  return () => { mounted.current = false; };
}, []);
```

## ModalPicker for cross-platform dropdowns

React Native has no reliable cross-platform `<select>`. A custom `Modal`-based picker
(see `src/components/ModalPicker.tsx`) gives a consistent dark-themed dropdown on iOS,
Android, and web. Accept `options: string[]`, `onSelect`, `onClose`, and an optional
`title`. Use `Pressable style={({ pressed }) => ...}` for press feedback.

## CSS module declarations for Expo default template

The `expo-template-default` (SDK 56) includes `animated-icon.web.tsx` which imports
CSS modules, and `constants/theme.ts` which has a side-effect CSS import. Add
`src/types/modules.d.ts` with `declare module '*.css' { ... }` to silence TS errors
without modifying the template files.

## EAS Build branch strategy

- `main` → preview APK build (internal distribution)
- `release/**` → production AAB + IPA builds
- Feature branches → PR to main (CI type-check + lint only)

Required CI secret: `EXPO_TOKEN`. Apple credentials enrolled via `eas credentials`
(interactive, not raw secrets in CI). Google Play upload via service account JSON
stored in EAS project secrets.
