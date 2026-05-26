# Horroscope

A dark, horror-themed horoscope app that delivers your daily Western or Chinese zodiac reading with a gothic twist. Built with React Native + Expo SDK 56.

Available on: **Android** (Google Play) · **Web** (Expo static export)

---

## What it does

- Users sign up with their name, zodiac type (Western or Chinese), and sign
- Each day, the app fetches a real horoscope reading and rewrites it in a horror/gothic style using Gemini AI via a Supabase Edge Function
- The rewritten reading is cached per user per day so it isn't re-generated on every load
- Users can toggle between the horror version and the original reading
- Support page links to a feedback form and donation page

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile/Web | React Native + Expo SDK 56 |
| Routing | Expo Router (file-based) |
| Auth + Database | Supabase (Auth, Postgres, RLS) |
| AI | Google Gemini via Supabase Edge Function (Deno) |
| Builds | EAS Build (Expo Application Services) |
| Deployment | EAS Submit → Google Play (Android) |

---

## Local development

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- A Supabase project with the schema and edge function deployed

### Setup

```bash
npm install
```

Copy the example env file and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

Run locally (web):

```bash
npx expo start --web
```

---

## Project structure

```
src/
  app/
    _layout.tsx        # Root layout — auth redirect, Stack navigator
    index.tsx          # Login / sign-up screen
    home.tsx           # Daily horoscope screen
    support.tsx        # Feedback, donation, notifications, delete account
  components/
    HeaderIconBtn.tsx  # Icon button with hover circle + tooltip (web)
    InlineDropdown.tsx # Expanding overlay dropdown (zodiac pickers)
    StyledCard.tsx     # Reusable dark card with red border
  constants/
    Colors.ts          # App-wide colour palette
    Zodiacs.ts         # Western and Chinese sign data
  services/
    auth.ts            # Supabase Auth wrappers (signIn, signUp, signOut, resetPassword)
    horoscope.ts       # Fetch/cache horoscope via Edge Function
    supabase.ts        # Supabase client initialisation
supabase/
  functions/
    horoscope-llm/     # Deno edge function — fetches real horoscope, rewrites with Gemini
assets/
  images/              # App icons, logos, splash screen
```

---

## Deploying to Android (Google Play)

### 1. Build

```bash
eas build --profile production --platform android
```

This queues a build on Expo's servers (~10–15 min). Output is an `.aab` (Android App Bundle).

### 2. Submit automatically (recommended)

Requires a Google Service Account JSON — see [Google Service Account setup](#google-service-account-setup) below.

```bash
eas submit --platform android --latest
```

The `eas.json` submit config targets the **internal** track. Promote to production in the Play Console once tested.

### 3. Submit manually

Download the `.aab` from the EAS build dashboard and upload it via [Google Play Console](https://play.google.com/console) → Internal Testing → Create new release.

---

## Google Service Account setup

This allows `eas submit` to upload builds to Google Play automatically without logging in manually.

1. Go to [Google Play Console](https://play.google.com/console) → Setup → API access
2. Link to a Google Cloud project (or create one)
3. Click **Create new service account** → follow the Google Cloud Console link
4. In Google Cloud Console: IAM & Admin → Service Accounts → Create Service Account
5. Grant the role **Service Account User** at the project level
6. Back in Play Console → grant the service account **Release manager** permissions on your app
7. In Google Cloud Console → Service Account → Keys → Add Key → JSON → download the file
8. Save the file as `google-service-account.json` in the project root (it is gitignored)

The `eas.json` already points to `./google-service-account.json` for the production submit profile.

---

## Supabase Edge Function

The horoscope generation runs as a Deno function in Supabase. To deploy after changes:

```bash
supabase functions deploy horoscope-llm
```

The Gemini API key is stored as a Supabase secret (never in code):

```bash
supabase secrets set GEMINI_API_KEY=your_key_here
```

---

## Environment variables

| Variable | Where it lives | Purpose |
|---|---|---|
| `SUPABASE_URL` | `.env.local` (local), EAS Secrets (build) | Supabase project URL |
| `SUPABASE_ANON_KEY` | `.env.local` (local), EAS Secrets (build) | Supabase publishable key |
| `GEMINI_API_KEY` | Supabase Secrets only | Gemini API — never in client code |
| `google-service-account.json` | Project root (gitignored) | Google Play automated submit |

---

## Maintenance

- **Horoscope quality**: Edit the system prompt in `supabase/functions/horoscope-llm/index.ts`, then redeploy the function
- **App version**: Managed remotely via EAS (`appVersionSource: remote`) — bump in the EAS dashboard, not in `app.json`
- **Colors/theme**: All values centralised in `src/constants/Colors.ts`
- **Zodiac signs**: Add or edit signs in `src/constants/Zodiacs.ts`
- **OTA updates** (JS-only changes, no native rebuild needed):
  ```bash
  eas update --branch production --message "describe the change"
  ```
