# 🕷️ TACHIKOMA QUEST — Viral Farcaster Mini App

Complete quests. Recast. Repost. Earn $TACHI on Base.

![Tachikoma Quest](https://img.shields.io/badge/Tachikoma-Quest-cyan)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Privy](https://img.shields.io/badge/Privy-Auth-purple)
![Neynar](https://img.shields.io/badge/Neynar-API-purple)

## 🎯 What It Does

Users open the mini app and complete viral quests:

1. **Follow on X** → 100 points
2. **Repost on X** → 200 points  
3. **Follow on Farcaster** → 150 points
4. **Recast on Farcaster** → 250 points
5. **Connect wallet for $TACHI airdrop** → 500 points

Each quest opens the action in a new tab. Farcaster actions are verified via Neynar API. Wallet submission logs the address for airdrop distribution.

## 🛠 Stack

- **Next.js 14** (App Router, static export)
- **Privy** — Auth + embedded wallets (Base chain)
- **Neynar** — Farcaster verification (follows, recasts)
- **Tailwind CSS** — Tachikoma cyan/purple/pink theme
- **Framer Motion** — Smooth animations
- **Vercel** — Hosting

## 🚀 Quick Start

```bash
# 1. Clone and enter
git clone <repo>
cd tachikoma-quest

# 2. Install
npm install

# 3. Env vars
cp .env.local.example .env.local
# Edit .env.local with your keys

# 4. Dev server
npm run dev
```

Open http://localhost:3000

## 🔐 Environment Variables

```bash
# Neynar (farcaster verification)
NEYNAR_API_KEY=...
NEYNAR_CLIENT_ID=...
NEYNAR_TARGET_FID=12345          # Your farcaster fid
NEYNAR_CAST_HASH=0x...           # Cast hash to verify recast

# Privy (auth + wallets)
NEXT_PUBLIC_PRIVY_APP_ID=...
PRIVY_APP_SECRET=...

# App config
NEXT_PUBLIC_TACHI_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 📁 Project Structure

```
app/
├── api/
│   ├── submit/route.ts      # Wallet submission endpoint
│   └── verify/route.ts      # Farcaster verification
├── globals.css              # Tachikoma theme
├── layout.tsx               # Root layout with Privy
└── page.tsx                 # Main quest UI

components/
├── Providers.tsx            # Privy + React Query
├── QuestCard.tsx            # Individual quest card
├── ProgressBar.tsx          # Quest progress
├── ShareButton.tsx          # Share/Copy link
└── WalletButton.tsx         # Connect wallet

lib/
├── neynar.ts                # Neynar API helpers
└── utils.ts                 # Quest config + utilities
```

## 🎨 Customization

Edit `lib/utils.ts` to change:

- Quest URLs (X handles, Farcaster casts)
- Points per quest
- Quest titles/descriptions

## 🚢 Deploy

### Vercel (Recommended)

1. Push to GitHub
2. Import repo in Vercel
3. Add env vars in Project Settings
4. Deploy

### Manual

```bash
npm run build
# Output in /dist
```

## 📱 Farcaster Mini App Setup

1. Create app at [Warpcast Developer Portal](https://warpcast.com/~/developers)
2. Set Frame URL to your deployed app
3. Configure callback URLs in Privy dashboard

## 🧪 Testing Quests

| Quest | Expected Behavior |
|-------|-------------------|
| Follow X | Opens X profile in new tab |
| Repost X | Opens X post in new tab |
| Follow Farcaster | Opens Warpcast profile |
| Recast | Opens Warpcast cast + verifies via API |
| Wallet | Triggers Privy login + submits address |

## 🔮 Future Enhancements

- [ ] Database storage (Supabase/Postgres)
- [ ] Real-time quest verification
- [ ] Leaderboard
- [ ] Referral tracking
- [ ] $TACHI token integration

## 📜 License

MIT — Tachikoma Swarm
