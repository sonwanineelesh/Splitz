# Splitz

> Split expenses. Not friendships.

## Run

```bash
npm install
npx expo start
```

Then:
- Press `a` → Android emulator
- Press `i` → iOS simulator  
- Scan QR → Expo Go app on your phone
- Press `w` → Web browser

For different networks:
```bash
npx expo start --tunnel
```

## Stack

- React Native + Expo SDK 57
- TypeScript
- Expo Router (file-based navigation)
- Zustand + AsyncStorage (offline persistence)
- Lucide icons
- Geist font

## Test

```bash
npm test
```

## Backend (optional, Supabase)

The app runs fully offline with no keys. To enable sync:

```bash
cp .env.example .env
# fill in EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Then deploy `supabase/schema.sql` in the Supabase SQL editor (tables + atomic expense RPC + RLS + indexes). See `backend-prd.md`.
