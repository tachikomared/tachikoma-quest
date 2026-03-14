# TACHIKOMA Quest — Farcaster Mini App

Minimal viral quest app for $TACHI on Base. Users complete quests (recasts, reposts, follows) and submit wallet for airdrop.

## Stack
- Next.js 14 (App Router)
- Privy (auth + embedded wallets)
- Neynar (Farcaster verification)
- Tailwind CSS

## Setup
1. Install deps:
   ```bash
   npm install
   ```

2. Copy `.env.local.example` → `.env.local` and fill values:
   ```env
   NEYNAR_API_KEY=...
   NEYNAR_CLIENT_ID=...
   NEYNAR_TARGET_FID=... # your Farcaster fid
   NEYNAR_CAST_HASH=...  # cast hash for recast verification

   NEXT_PUBLIC_PRIVY_APP_ID=...
   PRIVY_APP_SECRET=...

   NEXT_PUBLIC_TACHI_TOKEN_ADDRESS=0x...
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

3. Run dev server:
   ```bash
   npm run dev
   ```

## Deploy
- Push to GitHub
- Deploy on Vercel
- Set env vars in Vercel project settings

## Quest config
Update `lib/utils.ts` to change quest URLs, handles, and points.

## Airdrop submissions
POST `/api/submit` logs submissions. Replace this with a DB (Supabase, Postgres) or webhook.
