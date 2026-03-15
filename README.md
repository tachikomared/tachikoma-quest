# TACHI Quest — Farcaster Mini App + Quest Website

Complete verified Farcaster quests and link a Base wallet for $TACHI eligibility.

## Stack

- **Next.js 14** (App Router)
- **Farcaster Mini App SDK** + Quick Auth
- **Neynar API** for Farcaster verification
- **Postgres** (Neon)
- **Wagmi + Viem** for wallet linking (Base)
- **Vercel** for hosting

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_FARCASTER_APP_URL=https://warpcast.com/~/mini-apps/launch?url=<encoded_app_url>

NEYNAR_API_KEY=...
DATABASE_URL=...

FC_TARGET_FID=12345
FC_LAUNCH_CAST_HASH=0x...
FC_LAUNCH_CAST_URL=https://warpcast.com/~/casts/...

JWT_SECRET=long-random-string
```

## Quest Flow

- **Farcaster quests** use Neynar viewer context verification.
- **Wallet quest** uses wagmi connect + signature verification.
- **X quests** are open-only with 0 points.

## Scripts

```bash
npm run build
node scripts/run-schema.mjs
```

## Notes

- `/api/auth/farcaster/me` validates Quick Auth JWTs via `@farcaster/quick-auth`.
- `/api/me` returns the enriched Farcaster profile + points.
- `/api/quests/[id]/verify` only supports Farcaster verifications.
- `/api/wallet/link` handles wallet linking for Base.
