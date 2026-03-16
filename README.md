# LYNX — Premium Gay Dating App

Built by Pockito Labs. Stack: React Native + Expo SDK 52, Supabase, RevenueCat.

---

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Fonts

Download Outfit from https://fonts.google.com/specimen/Outfit
Weights needed: Light (300), Regular (400), Medium (500), SemiBold (600)
Place TTF files in `assets/fonts/`.

### 3. Environment

```bash
cp .env.example .env
```

Fill in:
- `EXPO_PUBLIC_SUPABASE_URL` — from your Supabase project Settings > API
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase project Settings > API
- `EXPO_PUBLIC_RC_APPLE_KEY` — from RevenueCat dashboard > Apple app > API keys
- `EXPO_PUBLIC_RC_GOOGLE_KEY` — from RevenueCat dashboard > Android app > API keys

### 4. Supabase

1. Create a new project at https://supabase.com
2. Run `supabase/schema.sql` in the SQL editor
3. Run `supabase/schema_additions.sql` in the SQL editor
4. Enable phone auth: Authentication > Providers > Phone

### 5. RevenueCat

1. Create account at https://revenuecat.com
2. Create a project, add iOS and Android apps
3. Create entitlement ID: `members_plus`
4. Create offerings with monthly and annual packages
5. Connect to App Store Connect and Google Play Console

### 6. EAS Build (required for RevenueCat + push notifications)

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Update `app.json` → `extra.eas.projectId` with your EAS project ID.

Development build (installs on device, supports native modules):
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### 7. Run

```bash
npx expo start
```

Scan the QR code with your development build (not Expo Go).

---

## Architecture

```
app/
  auth/          — splash, phone input, OTP verify
  onboarding/    — photos, about, intent mode
  tabs/          — main nav (members grid, messages, explore, profile)
  chat/[id]      — conversation screen
  member/[id]    — profile modal
  paywall        — RevenueCat Members+ paywall

src/
  lib/           — supabase, api, purchases, notifications
  store/         — zustand stores (auth, grid, chat, sub)
  components/    — ui, grid, chat, shared
  hooks/         — auth session, location, realtime, online presence
  constants/     — design tokens (colors, typography, spacing)
  types/         — TypeScript interfaces
  utils/         — helpers

supabase/
  schema.sql           — full DB schema with RLS
  schema_additions.sql — push tokens, geolocation RPC, private albums
```

---

## Pricing

| Market | Free | Members+ |
|---|---|---|
| LATAM (SV, MX, GT, CO) | Free | $2.99–4.99/mo |
| US / EU | Free | $9.99–19.99/mo |

Configure regional pricing in App Store Connect and Google Play Console.
RevenueCat entitlement: `members_plus`

---

## Key Features

- Phone number auth (Supabase OTP) — kills fake profiles
- Real GPS grid with Haversine SQL RPC
- Intent mode on every card (Now / Date / Chat / Travel)
- Voice notes with real expo-av playback
- AI icebreaker suggestions
- RevenueCat subscriptions with restore
- Push notifications (Expo Notifications + Supabase token storage)
- Discreet mode + safety check-in
- Private albums (schema ready, UI TBD)
