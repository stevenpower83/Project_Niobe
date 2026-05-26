# Session Notes — Project Niobe (Session 1, 2026-05-24)

## What's Done

### Project setup
- Scaffolded Expo SDK 56 project using `expo-template-default` (includes Expo Router + TypeScript)
- GitHub repo created: https://github.com/stevenpower83/Project_Niobe
- Main branch pushed; CI workflows active on GitHub

### Core files written
| File | Purpose |
|------|---------|
| `app.config.js` | Replaces `app.json` as primary Expo config; reads Supabase creds from env vars as Expo public constants |
| `eas.json` | EAS Build profiles: development, preview (APK), production (AAB + IPA) |
| `.env.example` | Documents required env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) |
| `src/services/supabase.ts` | Supabase client with `expo-secure-store` JWT storage adapter |
| `src/services/auth.ts` | signUp / signIn / signOut / resetPassword — thin wrappers over Supabase auth |
| `src/services/horoscope.ts` | getHoroscope / refreshHoroscope — daily caching with stale fallback |
| `src/constants/Colors.ts` | Design token palette (dark red gothic theme) |
| `src/constants/Zodiacs.ts` | Western/Chinese sign maps, emoji lookup, ZodiacType type |
| `src/components/StyledCard.tsx` | Dark card container with red border |
| `src/components/ModalPicker.tsx` | Cross-platform dropdown using Modal + ScrollView |
| `src/app/_layout.tsx` | Root Stack layout; auth listener redirects on session change |
| `src/app/index.tsx` | Login screen (sign-in / sign-up toggle, forgot password) |
| `src/app/home.tsx` | Home screen (horoscope display, horror/original toggle, refresh) |
| `src/app/support.tsx` | Support screen (feedback, donation, notifications stub, delete account) |
| `src/types/modules.d.ts` | CSS module type declarations for template files |

### GitHub Actions
| Workflow | Trigger | Action |
|----------|---------|--------|
| `ci.yml` | Push to main or PR to main | TypeScript check + expo lint |
| `android-deploy.yml` | Push to main | EAS production AAB build + Google Play internal upload |
| `eas-build-preview.yml` | Push to main | EAS preview Android APK |
| `eas-build-release.yml` | Push to `release/**` | EAS production AAB (Android) + IPA (iOS) |

## What's TODO

### Must-do before first TestFlight/Play Store build
1. **EAS project ID** — Run `eas init` in the project directory. This links the project to your EAS account and fills `EAS_PROJECT_ID` in `eas.json`. Must be done interactively.
   ```
   cd Project_Niobe
   npx eas-cli init
   ```
2. **Set GitHub secret `EXPO_TOKEN`** — Generate in Expo dashboard at expo.dev → Account Settings → Access Tokens. Add to repo: Settings → Secrets → Actions → New secret: `EXPO_TOKEN`.
3. **Set GitHub secrets `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`** — Same place in GitHub secrets.
4. **Apple enrollment** — Before the iOS build in `eas-build-release.yml` will work, run:
   ```
   npx eas-cli credentials --platform ios
   ```
   This creates the distribution cert, provisioning profile, and push key interactively.
5. **Android keystore** — EAS manages this automatically on first production build (or use `eas credentials --platform android`).

### Nice-to-have
- ~~Replace the logo placeholder~~ ✓ Done — real app logo images in place.
- Add `expo-linking` deep link handler for the password reset redirect URL (`horroscope://reset-password`) so users land back in the app after clicking the email link.
- Wire up Expo Notifications / OneSignal for the daily prophecy push (the `notifications_enabled` DB column and toggle UI are already in place).
- Add `package-lock.json` to `.gitignore` if you prefer not to commit lockfile (currently committed; fine either way).
- Write unit tests for `horoscope.ts` (cache logic, date calculation, stale fallback path).

## Non-obvious Decisions

### Why `app.config.js` instead of `app.json`
Expo's static `app.json` can't read environment variables at build time. `app.config.js` is executed by Expo CLI so it can call `process.env`. We expose Supabase creds via `expo.extra` so they're available in the app via `Constants.expoConfig?.extra`.

### Why `EXPO_PUBLIC_` prefix for Supabase vars
The anon key is designed to be public (protected by RLS, not secrecy). Prefixing with `EXPO_PUBLIC_` makes intent explicit and is consistent with the Vite/Next.js convention. Supabase service role key must NEVER appear here.

### Auth redirect: `useRef` to prevent loop
The auth `useEffect` fires whenever `session` changes. Without a `initialRedirectDone` ref, navigating between `/home` and `/support` while the session remains valid would keep redirecting back to `/home`. The ref ensures the initial redirect fires once; subsequent fires only redirect on sign-out.

### Mounted ref in async screens
Both `home.tsx` and `support.tsx` use `mounted = useRef(true)` and guard every async callback with `if (!mounted.current) return`. This prevents "Can't perform a React state update on an unmounted component" warnings when users navigate away mid-fetch.

### `explore.tsx` kept as stub
The Expo default template includes `explore.tsx` which references `@/components/...` pattern. We replaced the body with a minimal stub to keep TypeScript happy without deleting the file (can't delete with Write tool). It registers an unused `/explore` route — harmless.

### CSS module declarations
The template's `animated-icon.web.tsx` imports a `.css` file; `constants/theme.ts` has a side-effect CSS import. We added `src/types/modules.d.ts` with `declare module '*.css' { ... }` so TypeScript doesn't error on these.

## Commands to Resume in a Fresh Session

```powershell
# Navigate to project
cd "C:\Users\StevenPower\OneDrive - Steven Power\OneDrive\Documents\POWR DATA\GitHub\Project_Niobe"

# Start Expo dev server (after setting env vars)
$env:EXPO_PUBLIC_SUPABASE_URL = "https://xxx.supabase.co"
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key"
npm start

# TypeScript check
npx tsc --noEmit

# Link EAS project (one-time, interactive)
npx eas-cli init

# Enroll Apple credentials (one-time, interactive — requires Apple Developer account)
npx eas-cli credentials --platform ios

# Trigger a preview build manually
npx eas-cli build --platform android --profile preview
```
