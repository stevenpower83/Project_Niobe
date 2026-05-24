# POWR DATA — React Native App Development Best Practices

Reference for all tooling, workflow, and architecture decisions across projects.
Updated: 2026-05-24. Revise when the ecosystem evolves.

---

## Stack Choices

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | React Native + Expo SDK (latest stable) | Officially recommended by the RN team; managed toolchain handles native complexity |
| Language | TypeScript (strict) | Catches bugs at compile time; required for team scale |
| Routing | Expo Router (file-based) | Typed routes, deep linking, web support from same codebase |
| Package manager | npm | Ships with Node; consistent lockfile across machines |
| Build service | EAS Build | M4 Pro hardware, managed code signing, no macOS required |
| OTA updates | EAS Update | Ship JS fixes without store review; 60–80% smaller updates via bundle diffing |
| Session storage | expo-secure-store (native) / localStorage (web) | Keychain-backed on device; graceful web fallback |
| Auth | Supabase Auth | Managed JWT, RLS enforcement, email/social/magic link |

---

## Development Workflow

### Local development (daily)

```
npm start
```

- Uses your **development build** (custom APK/IPA with expo-dev-client installed on device)
- Changes hot-reload instantly — no rebuild needed for JS/TS changes
- Native changes (new packages with native code, config changes) require a new development build

**Never use Expo Go** — it's a beginner tool. Development builds are your permanent dev environment.

### Development build (rebuild when native changes)

```bash
# Android
eas build --platform android --profile development

# Install the APK on device, then just use npm start
```

Rebuild triggers:
- Adding a package that has native code
- Changing `app.config.js` plugins
- Upgrading Expo SDK

### Web testing

```bash
# Set env vars first (once per terminal session)
set EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
set EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

npm start
# then press w
```

---

## OTA vs Native Build — Decision Tree

```
Did you change native code? (new packages, plugins, config)
├── YES → fingerprint changed → new EAS build required
└── NO  → JS/TS/assets only → EAS Update (OTA), ships in 3–5 min
```

The `fingerprint` runtime version policy enforces this automatically.
Devices reject updates whose fingerprint doesn't match their build.

---

## Channel Strategy

| Channel | Build profile | Who uses it | How deployed |
|---------|--------------|-------------|--------------|
| `development` | development | Developers only | Install APK manually |
| `preview` | preview | Internal testers | OTA on every merge to main |
| `production` | production | End users (App Store / Play Store) | OTA after release build ships |

---

## CI/CD Pipeline

| Event | Action | Time |
|-------|--------|------|
| PR opened/updated | Type-check + lint | ~2 min |
| Merge to `main` | EAS Update → `preview` channel | ~3–5 min |
| Push `release/**` branch | EAS Build (AAB + IPA) + EAS Update → `production` | ~20 min |

### Release process

1. Create branch: `release/1.2.0`
2. CI builds native binaries and submits to Play Store / App Store
3. CI then pushes OTA update to production channel (existing installs update immediately)
4. Store review takes 1–3 days for new users

---

## Runtime Version (OTA Safety)

Policy: **`fingerprint`** — generates a hash of all native dependencies and config.

- OTA updates only apply to builds with a matching fingerprint
- If fingerprint changes → new build required → CI creates it automatically on release branch
- Prevents JS-native mismatches that crash apps

Never use `appVersion` policy — it's easy to forget to bump the version and ship a broken OTA.

---

## Code Signing

- **Android**: Managed by EAS (keystore stored in EAS secrets, never in repo)
- **iOS**: Managed by EAS credentials (`eas credentials --platform ios`) — no raw certs in CI

---

## Secrets Management

| Secret | Where stored | Who has access |
|--------|-------------|----------------|
| `EXPO_TOKEN` | GitHub repo secrets | CI only |
| `EXPO_PUBLIC_SUPABASE_URL` | GitHub repo secrets | CI; local via `set` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | GitHub repo secrets | CI; local via `set` |
| `SUPABASE_SERVICE_ROLE_KEY` | Never in client code | Server/edge functions only |
| `GEMINI_API_KEY` | Supabase Secrets | Edge function only |
| Google Play service account JSON | EAS secrets | CI only (never committed) |
| Apple certs/profiles | EAS credentials | Managed by EAS |

---

## Project Structure

```
src/
  app/          ← Expo Router screens (file = route)
  components/   ← Shared UI — no business logic
  services/     ← Supabase, auth, API calls
  constants/    ← Colors, zodiac data, design tokens
  types/        ← TypeScript declarations
assets/
  images/       ← App icons, logos (real files, not placeholders)
.github/
  workflows/    ← CI: ci.yml, eas-build-preview.yml, eas-build-release.yml
```

---

## Coding Standards

- **TypeScript strict mode** — no `any`, no unchecked types
- **No comments unless the WHY is non-obvious** — code should be self-documenting
- **Mounted ref pattern** on every screen with async work — prevents setState on unmounted
- **Platform checks** for native-only APIs (`expo-secure-store`, `Linking`, etc.)
- **No hardcoded credentials** — everything via `Constants.expoConfig.extra` or env vars
- **Services layer** — Supabase calls only in `src/services/`, never inline in screens

---

## When to Use EAS Update vs Full Release

| Scenario | Action |
|----------|--------|
| Bug fix (JS only) | `eas update --channel production` |
| New screen or feature (JS only) | `eas update --channel production` |
| New npm package with native code | New build → `release/**` branch |
| Expo SDK upgrade | New build → `release/**` branch |
| App icon / splash change | New build → `release/**` branch |
| Supabase query change | EAS Update |
| UI styling change | EAS Update |

---

## Future Considerations

- **EAS Workflows** — replace GitHub Actions with Expo's native CI when project scales (M4 Pro builders, fingerprint-aware builds, ~6 lines of YAML)
- **Sentry** — crash monitoring before first public release
- **EAS Insights** — app analytics once in production
- **Apple Developer enrollment** — required before iOS builds; enroll at developer.apple.com
