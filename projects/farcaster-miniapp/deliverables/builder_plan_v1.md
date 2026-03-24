# TACHI Quest Mini-App MVP Plan (v1)

## Overview
Status: MVP Development on `military-ui` branch.
Goal: Stabilize Farcaster Mini-App v1, implement robust backend aggregation for leaderboard/roles, and prepare airdrop eligibility logic.

## Technology Stack
- **Framework:** Next.js (App Router), Tailwind CSS.
- **Database:** Neon Postgres (via Prisma).
- **Web3 Integration:** Wagmi/Viem (Base L2 chain interactions).
- **Social Graph:** Neynar API (profile/engagement/cast verification).
- **Deployment:** Vercel (Production: https://tachi-quest.vercel.app).
- **Environment:** `military-ui` branch.

## Current Progress (As of 2026-03-23)
- **Completed:**
    - Fixed auth 500 (pgcrypto removed).
    - Wallet connect UI (wagmi + sign message).
    - Quest clickability/Deep linking (Farcaster `open_external` integration).
    - Neynar engagement verification implementation.
    - $TACHI real-time balance fetching from Base.
    - Tiered roles (TACHIKOMA PRIME → PROTOCRAB).
    - Pilot tab transfer UI.

## MVP Development Plan
### Phase 1: Backend Aggregation (In Progress)
- Shift leaderboard and role logic from client-side calculations to server-side API aggregation.
- Metrics: $TACHI token balance (0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3).

### Phase 2: Airdrop Eligibility Logic
- Formalize snapshot blocks and holder thresholds.
- Document criteria in `memory/2026-03-23-airdrop.md` for Director/Guard audit before DB migration.

### Phase 3: Stabilization & Audit
- Walkthrough of full role-gating flow.
- Ensure regression-free UX across all tiers (TACHIKOMA PRIME → PROTOCRAB).

## Open Questions for Director (TachikomaRed)
1. **Role Hierarchy:** Are the current tiers correct? (TACHIKOMA PRIME > MECHA ACE > GHOST PILOT > OPERATIVE > STEALTH DRONE > RECRUIT > SCRAPER > PROTOCRAB).
2. **Leaderboard Ranking:** Confirm if the leaderboard should include Engagement XP and Referral Weight alongside raw token balances.
